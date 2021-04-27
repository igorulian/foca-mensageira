require('dotenv').config()
const Twitter2 = require('twitter-v2');
var Twit = require('twit')
const { getCache, setCache } = require('../cache-controller');


const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const botID = '1385255336899235840'


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
        const lastMessages = await getMessages()
        analyzeLastMessages(lastMessages)
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

            if(element.message_create.sender_id === botID) return

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
        })
    })

    await sleep(2000)

    console.log(lastMessages)

    return lastMessages

}


async function getUsernameById(userid){
    const data = await clientv2.get('users/' + userid)
    return data.data.username
}

async function analyzeLastMessages(lastMessages){

    lastMessages.forEach(async (message) => {
        
        const userCahe = getCache(message.userid)

        if(userCahe && userCahe.lastMessage === message.text) return

        try{

            message.text = message.text.replace('\n', '')
            
            let anonimo = ''
            let to = ''
            let txt = ''

            anonimo = message.text.split(':')[1]
            anonimo = anonimo.toString().toLowerCase().replace('não', 'nao')
            anonimo = anonimo.toString().includes('nao') ? false : anonimo
            anonimo = anonimo.toString().includes('sim') ? true : anonimo

            to = message.text.split(':')[2]
            to = to.toString().trim()
            to = to.toString().split(' ')[0]
            to = to.toString().includes('@') ? to : false

            txt = message.text.split(':')[3]
            txt = txt.toString().trim()

            const mensagem = {
                anonimo,
                to,
                txt
            }

            if(anonimo === '' || to === '' || txt === ''){
                sendMessage(message.userid, 'Não foi possivel ler sua mensagem corretamente, leia no tweet fixado como enviar uma mensagem e tente novamente :)')
            }else{
                sendMessage(message.userid, 'Perfeito! Sua mensagem foi contabilizado e logo será twitada! Obrigado por usar os nossos serviços :)')
            }

            console.log(mensagem)

        }catch{
           sendMessage(message.userid, 'Não foi possivel ler sua mensagem corretamente, leia no tweet fixado como enviar uma mensagem e tente novamente :)')
        }

        setCache({userid: message.userid, lastMessage: message.text})

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



async function removeMessage(messageid){ //https://twitter.com/i/api/1.1/dm/conversation/1284132824967196673-1385255336899235840/delete.json
    T.delete(`/direct_messages/events/destroy?id=${messageid}`, (err, response, t) => {
        if(err){
            console.log(err)
            return
        }
        console.log(response)
        // console.log(t)
    })
}


// this is a SUPER gambirarra (if u dont know what it means, try to check on google)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




