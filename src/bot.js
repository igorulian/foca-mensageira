require('dotenv').config()
const axios = require('axios')
const Twitter = require('twitter');
const Twitter2 = require('twitter-v2');
var Twit = require('twit')
const cache = require('./cache-controller')


const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
// const bearerToken = process.env.BEARER_TOKEN
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET

// const botID = '1385255336899235840'


const client = new Twitter({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token_key: acessTokenKey,
    access_token_secret: acessTokenSecret,
});


var T = new Twit({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token: acessTokenKey,
    access_token_secret: acessTokenSecret,
  })

const clientv2 = new Twitter2({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token_key: acessTokenKey,
    access_token_secret: acessTokenSecret,  
})

module.exports = {
    async start() {
        while (true) {
            const lastMessages = await getMessages()
            const analyzedLastMessages = analyzeLastMessages(lastMessages)

            await sleep(60 * 1000)
        }
    }
}


async function getMessages(){ //2940913690

    const lastMessages = []

    T.get('direct_messages/events/list.json?count=50' , (error, twitteresp, response) => {

        if(error){
            console.log(error)
            return
        }

        twitteresp.events.forEach(element => {

            const senderLastMessage = {
                userid: element.message_create.sender_id,
                text: element.message_create.message_data.text
            }

            let alreadyHasUser = false

            lastMessages.forEach(message => {
                if(message.userid === senderLastMessage.userid){
                    alreadyHasUser = true
                }
            });

            if(!alreadyHasUser){ lastMessages.push(senderLastMessage) }

            // console.log(element)
        })
    })

    await sleep(2000)


    return lastMessages

}


async function getUsernameById(userid){
    const data = await clientv2.get('users/' + userid)
    return data.data.username
}

async function analyzeLastMessages(lastMessages){

    lastMessages.forEach(async (message) => {
        console.log(message)
        const userCahe = cache.getCache(message.userid)

        if(!userCahe && message.text.toString().toLowerCase().includes('oi')){
            console.log(`Setando ${message.userid} para o lvl 0`)

            const username = await getUsernameById(message.userid)

            cache.setCache({userid: message.userid, username, level: 0, lastMessage: message.text})
            sendMessage(message.userid, 'Oi! Eu sou a foca mensageira! Caso queira enviar uma mensagem para alguém basta me mandar o @ do destinatário que começaremos as etapas para o envio!')
            return
        }

        if(!userCahe) return

        const text = message.text
        if(text === userCahe.lastMessage) return


        switch(userCahe.level){

            case 0:
                if(message.text.includes('@')){
                    let userName = ''

                    const words = message.text.split(' ')

                    words.forEach(word => {
                        if(word.includes('@')){
                            userName = word
                        }
                    });

                    console.log(`Setando ${message.userid} para o lvl 1`)
                    cache.setCache({userid: message.userid, level: 1, to: userName.trim()})
                    // enviar msg para enviar se deseja enviar anonimanete ou não
                    sendMessage(message.userid, 'Certo! Deseja enviar a mensagem anonimamente? caso deseja digite apenas "sim", caso contrário digite "não" ')

                }else{
                    sendMessage(message.userid, 'Não consegui identificar uma resposta, favor enviar novamente')
                }

                break

            case 1:               
                let anonymous = false


                if(text.toString().toLowerCase().includes('sim') || text.toString().toLowerCase().includes('não') || text.toString().toLowerCase().includes('nao')){
                    if(text.toString().toLowerCase().includes('sim')){
                        anonymous = true
                    }
    
                    console.log(`Setando ${message.userid} para o lvl 2`)
                    cache.setCache({userid: message.userid, level: 2, anonymous})
                    // enviar tipo.. 'OK! , agora envie o texto que deseja enviar, apenas o texto
                    sendMessage(message.userid, 'Certo! Agora me envie a mensagem que deseja enviar!')
                }else{
                    sendMessage(message.userid, 'Não consegui identificar uma resposta, favor enviar novamente')
                }

                break

            case 2:

                if(text.includes('http')){
                    sendMessage(message.userid, 'Não consegui indentificar, favor enviar novamente')
                    break
                }

                console.log(`Setando ${message.userid} para o lvl 3`)
                cache.setCache({userid: message.userid, level: 3, text})
                // enviar tipo.. 'OK! , agora irei te enviar um preview do tweet, caso esteja tudo certo digite 'sim' caso contrario digite 'não
                
                
                sendMessage(message.userid, `Perfeito! Agora é só confirmar os dados!, caso esteja tudo correto digite "sim" caso contrário digite "não"
                De: ${userCahe.anonymous ? 'Anônimo' : userCahe.userName} Para: ${userCahe.to}
                ${message.text} `)

                break

            case 3:

                let correct = false

                if(!(text.toString().toLowerCase().includes('sim') || text.toString().toLowerCase().includes('não') || text.toString().toLowerCase().includes('nao'))){
                    return
                }

                if(text.toString().toLowerCase().includes('sim')){
                    correct = true
                }


                if(correct){
                    // twittar
                    sendMessage(`Ótimo! Sua mensagem foi posta na pilha de mensagem e logo será enviada! obrigado por utilizar nossos serviços!
                     lembrando que pode enviar outra a qualquer momento, basta digitar "oi" e o processo iniciará novamente :)`)

                    twitar(`De: ${userCahe.anonymous ? 'Anônimo' : userCahe.username} | Para: ${userCahe.to}
                    ${userCahe.text}`)
                    // enviar msg falando que deu tudo certo!
                }else{
                    // enviar msg que deu errado e que vai tentar dnv
                    sendMessage(message.userid, 'Putz, tudo bem! Vamos iniciar novamente, digite "oi" para inicarmos uma mensagem do zero!')
                }

                console.log(`Setando ${message.userid} para o lvl 0`)
                cache.saveHistory(userCahe)
                cache.removeCache(message.userid)
                return

            default:
                console.log('nenhum level se encaixa o user  ' + message.userid)
        }

        if(userCahe) {cache.setCache({userid: message.userid, lastMessage: message.text})}


        
    });
}

async function sendMessage(userid,txt){

    const data = {
        event:{
            type: "message_create",
            message_create:{
                target:{
                    recipient_id: userid
                },
                message_data:{
                    text: txt
                }
            }
        }
    }

    T.post('direct_messages/events/new', data, (error,ttr,resp) => {
        if (error) {
            console.log(error)
        }
    });
}


async function twitar(txt){
    console.log('TWITANDO ' + txt)
}

async function removeMessage(){ //https://twitter.com/i/api/1.1/dm/conversation/1284132824967196673-1385255336899235840/delete.json
    client.delete('dm/conversation/1284132824967196673-1385255336899235840/delete.json', (err, response) => {
        if(err){
            console.log(err)
            return
        }
        console.log(response)
    })
}


// this is a SUPER gambirarra (if u u dont know what it means, try to check on google)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




