require('dotenv').config()
const axios = require('axios')
const Twitter = require('twitter');
const cache = require('./cache-controller')


const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
// const bearerToken = process.env.BEARER_TOKEN
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET


const firstTrigger = ['oi', 'olá']

// const botID = '1385255336899235840'


const client = new Twitter({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token_key: acessTokenKey,
    access_token_secret: acessTokenSecret,
});

module.exports = {
    async start() {
        // getMessages()
        const lastMessages = await getMessages()
        const analyzedLastMessages = analyzeLastMessages(lastMessages)
        // removeMessage()
        // teste()
    }
}


async function getMessages(){ //2940913690

    const lastMessages = []

    client.get('direct_messages/events/list.json?count=50' , (error, twitteresp, response) => {

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

async function analyzeLastMessages(lastMessages){

    // console.log(lastMessages)

    lastMessages.forEach(message => {
        console.log(message)
        const userCahe = cache.getCache(message.userid)

        if(!userCahe && message.text.toString().toLowerCase().includes('oi')){
            console.log(`Setando ${message.userid} para o lvl 0`)
            cache.setCache({userid: message.userid, level: 0, lastMessage: message.text})
            console.log('==== Ok! me envie o @ do destinatario ====')
            return
        }

        if(userCahe){
            const userCache = cache.getCache(message.userid)

            if(userCahe.level === 0 && message.text.includes('@') && message.text !== userCahe.lastMessage){
                let userName = ''

                const words = message.text.split(' ')
                words.forEach(word => {
                    if(word.includes('@')){
                        userName = word
                    }
                });

                userName = userName.trim()

                if(userName !== ''){
                    console.log(`Setando ${message.userid} para o lvl 1`)
                    cache.setCache({userid: message.userid, level: 1, to: userName, lastMessage: message.text})
                    // enviar msg para enviar se deseja enviar anonimanete ou não
                    console.log('==== Deseja enviar a mensagem anonimamente? ====')
                }else{
                    cache.setCache({userid: message.userid, lastMessage: message.text})
                    // enviar msg que não conseguu identificar username
                }
                return
            }

            if(userCahe.level === 1 && message.text !== userCahe.lastMessage){
                const text = message.text

                let anonymous = false


                if(text.toString().toLowerCase().includes('sim') || text.toString().toLowerCase().includes('não') || text.toString().toLowerCase().includes('nao')){
                    if(text.toString().toLowerCase().includes('sim')){
                        anonymous = true
                    }
    
                    console.log(`Setando ${message.userid} para o lvl 2`)
                    cache.setCache({userid: message.userid, level: 2, anonymous, lastMessage: message.text})
                    // enviar tipo.. 'OK! , agora envie o texto que deseja enviar, apenas o texto
                        console.log('==== Ok! Agora me envie o texto que deseja enviar ====')
                }else{
                    console.log('==== Não foi possível identificar a resposta, envie novamente ====')
                }

            }

            if(userCahe.level === 2 && !message.text.includes('@' + userCahe.to) && message.text !== userCahe.lastMessage){
                const text = message.text

                if(text.includes('http')){
                    console.log('Ocorreu um erro ao indentificar, favor enviar novamente')
                    cache.setCache({userid: message.userid, lastMessage: message.text})
                    return
                }

                console.log(`Setando ${message.userid} para o lvl 3`)
                cache.setCache({userid: message.userid, level: 3, text, lastMessage: message.text})
                // enviar tipo.. 'OK! , agora irei te enviar um preview do tweet, caso esteja tudo certo digite 'sim' caso contrario digite 'não
                    console.log('==== Ok! Agora confirme os dados, sim ou nao ====')
                    console.log(' ')
                    console.log('Confirme:')
                    console.log(`De: ${userCahe.anonymous ? 'Anônimo' : userCahe.userid} | Para: ${userCahe.to}`)
                    console.log(`${message.text}`)
                    console.log(' ')
            }

            if(userCahe.level === 3 && message.text !== userCahe.lastMessage){
                const text = message.text

                let correct = false

                if(!(text.toString().toLowerCase().includes('sim') || text.toString().toLowerCase().includes('não') || text.toString().toLowerCase().includes('nao'))){
                    return
                }

                if(text.toString().toLowerCase().includes('sim')){
                    correct = true
                }


                if(correct){
                    // twittar
                    console.log(' ')
                    console.log('TWITE:')
                    console.log(`De: ${userCahe.anonymous ? 'Anônimo' : userCahe.userid} | Para: ${userCahe.to}`)
                    console.log(`${userCahe.text}`)
                    console.log(' ')
                    // enviar msg falando que deu tudo certo!
                }else{
                    // enviar msg que deu errado e que vai tentar dnv
                    console.log('deu errado vamos resetar')
                }

                console.log(`Setando ${message.userid} para o lvl 0`)
                cache.removeCache(message.userid)
                // sair da conversa no tttr
            }

        }

        console.log('nenhum level se encaixa o user  ' + message.userid)

        
    });
}

async function sendMessage(){

    const data = {
        type: "message_create",
        message_create:{
            target:{
                recipient_id: '2940913690'
            },
            message_data:{
                text: 'eba kraio'
            }
        }
    }

    client.post('/direct_messages/events/new', data, error => {
        if (!error) {
    
            const senderid = message.message_create.sender_id
            if(senderid === botID) return
            const sendermessage = message.message_create.message_data.text
            console.log(`Sender: ${senderid} | Message: ${sendermessage}`)

            console.log('mensagem enviada')
        }else{
            console.log(error)
        }
    });
}


async function removeMessage(){
    client.delete('https://api.twitter.com/1.1/direct_messages/events/destroy.json?id=1284132824967196673', (err, response) => {
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




