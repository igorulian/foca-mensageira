require('dotenv').config()
const Twitter2 = require('twitter-v2');
var Twit = require('twit')
const { getCache, setCache, addToTweetCache} = require('../cache-controller');


const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const botID = '1385255336899235840' //BOT ID to ignore the messages

const client = new Twit({
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

const msgSucess = 'Perfeito! \nSua mensagem foi contabilizado e logo será twitada! \nObrigado por usar os nossos serviços :)'
const msgError = 'Não foi possivel ler sua mensagem corretamente. Para enviar uma mensagem envie no seguinte molde: \n \nAnônimo: sim/não\nPara: @pessoa\nMensagem: Mensagem que deseja enviar'
const msgErrorTweetFit = 'Não foi possivel enviar sua mensagem pois ela é muito longa \n tente enviar novamente de uma mandeira mais abreviada'
const msgErrorMessagePejorative = 'EEI! Nada de ofender os outros por aqui! \nSe quer ofender algúem fala na cara!'

const pejorativeWords = ['feio', 'feia', 'chato', 'chata', 'puta', 
'vagabundo', 'vagabunda', 'biscate', 'piranha', 'galinha', 'gordo', 
'gorda', 'idiota', 'buceta', 'caralho', 'pinto', 'pau', 'mamada']



module.exports = {
    async start() {
        while (true){
            try{
                const lastMessages = await getMessages()
                analyzeLastMessages(lastMessages)

                await sleep(120 * 1000)
                
            }catch(err){
                console.log(err)
            }
        }
    }
}


async function getMessages(){

    const lastMessages = []

    client.get('direct_messages/events/list.json?count=50' , (error, twitteresp, response) => {

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


async function analyzeLastMessages(lastMessages){

    lastMessages.forEach(async (message) => {
        
        const userCahe = getCache(message.userid)

        if(userCahe && userCahe.lastMessage === message.text) return

        try{

            let text = message.text.replace('\n', '')
            
            let anonymous = ''
            let to = ''
            let txt = ''
            let from = ''

            anonymous = getAnonymous(text)
            to = getTo(text)
            txt = getTxt(text)
            from = await getUsernameById(message.userid)

            const tweet = {
                fromId: message.userid,
                anonymous,
                from,
                to,
                text: txt
            }

            const hasAllFields = !(anonymous === '' || to === '' || txt === '' || from === '')
            const fitOnTweet = checkFitOnTweet(tweet)
            const ispejorative = checkIsPejorative(tweet)

            if(!hasAllFields)
                sendMessage(message.userid, msgError)
            if(!fitOnTweet)
                sendMessage(message.userid, msgErrorTweetFit)
            if(ispejorative)
                sendMessage(message.userid, msgErrorMessagePejorative)

            
            if(hasAllFields && fitOnTweet && !ispejorative){
                addToTweetQueue(tweet)
                sendMessage(message.userid, msgSucess)
            }
            

            console.log(tweet)

        }catch(err){
           sendMessage(message.userid, msgError)
        }

        setCache({userid: message.userid, lastMessage: message.text})

    });
}

function getAnonymous(text){
    let anonymous = text.split(':')[1]
    anonymous = anonymous.toString().toLowerCase().replace('não', 'nao')
    anonymous = anonymous.toString().includes('nao') ? false : anonymous
    anonymous = anonymous.toString().includes('sim') ? true : anonymous
    return anonymous
}

function getTo(text){
    let to = text.split(':')[2]
    to = to.toString().trim()
    to = to.toString().split(' ')[0]
    to = to.toString().split('\n')[0]
    to = to.toString().includes('@') ? to : false
    return to
}

function getTxt(text){
    let txt = text.split(':')[3]
    txt = txt.toString().trim()
    return txt
}

function checkFitOnTweet(tweet){
    const tweetTxt = `${tweet.anonymous ? '' : 'De: ' + tweet.from} \nPara: ${tweet.to} \n${tweet.text}`

    if(tweetTxt.length > 280 + 1)
        return false
    else
        return true

}

async function getUsernameById(userid){
    const data = await clientv2.get('users/' + userid)
    return data.data.username
}

function checkIsPejorative(tweet){
    const text = tweet.text

    let hasPejorativeWords = false

    pejorativeWords.forEach(word => {
        if(text.toString().toLowerCase().includes(word)) {
            hasPejorativeWords = true
        }
    });

    return hasPejorativeWords
}

function addToTweetQueue(tweet){
    addToTweetCache(tweet)
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

    client.post('direct_messages/events/new', data, (error,ttr,resp) => {
        if (error) {
            console.log(error)
        }
    });
}



async function removeMessage(userid){ //https://twitter.com/i/api/1.1/dm/conversation/1284132824967196673-1385255336899235840/delete.json
    client.post(`i/api/1.1/dm/conversation/${userid}-1385255336899235840/delete.json`, (err, response, t) => {
        if(err){
            console.log(err)
            return
        }
        console.log(response)
    })
}


// this is a SUPER gambirarra (if u dont know what it means, try to check on google)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }




