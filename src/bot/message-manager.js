require('dotenv').config()
const Twitter2 = require('twitter-v2');
var Twit = require('twit')
const { getCache, setCache, addToTweetQueue, removeCache} = require('../cache-controller');
var request = require('request');

const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const leaveConversationBearerToken = process.env.LEAVE_CONVERSATION_BEARER_TOKEN
const leaveConversationCsrfToken = process.env.LEAVE_CONVERSATION_CSRF_TOKEN

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

const msgSucess = 'Perfeito! \nSua mensagem foi contabilizado e logo será twitada! \nObrigado por usar os nossos serviços :) \nFique a vontade para enviar quantas mensagens desejar.'
const msgError = 'Não foi possivel ler sua mensagem corretamente. Para enviar uma mensagem envie no seguinte molde: \n \nAnônimo: sim/não\nPara: @pessoa\nMensagem: Mensagem que deseja enviar'
const msgErrorTweetFit = 'Não foi possivel enviar sua mensagem pois ela é muito longa. \nTente enviar novamente de uma mandeira mais abreviada'
const msgErrorMessagePejorative = 'EEI! Nada de ofender os outros por aqui! \nSe quer ofender alguém fala na cara! \nManda outra coisa ai!'
const msgWaitingConfirmation = tweettxt => (`Ótimo! Agora confirme as informações. Caso esteja tudo correto digite "sim", caso contrário digite "não". \n \n${tweettxt}`)
const msgNotConfirmed = 'Putz, ok! Vamos começar tudo de novo! \nMe mande novamente qual a mensagem deseja (seguindo o molde que está no tweet fixado)'
const msgCantFindConfirmation = 'Não consegui identificar sua resposta, tente enviar novamente!'

const pejorativeWords = ['feio', 'feia', 'chato', 'chata', 'puta',
'vagabundo', 'vagabunda', 'biscate', 'piranha', 'galinha', 'gordo',
'gorda', 'idiota', 'buceta', 'caralho', 'pinto', 'pau', 'mamada']



module.exports = {
    async start() {
        console.log('✔️ Messaga controller started')
        while (true){
            try{      
                // const requestsRemaing = await getReqRemaing()

                const lastMessages = await getMessages()

                analyzeLastMessages(lastMessages)
                
            }catch(err){
                console.log(err)
            }
            
            await sleep(80 * 1000)
        }
    }
}


async function getMessages(){

    const lastMessages = []

    const messages = (await client.get('direct_messages/events/list.json?count=50')).data

    await messages.events.forEach(element => {

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

    return lastMessages
}


async function analyzeLastMessages(lastMessages){

    lastMessages.forEach(async (message) => {
        // console.log(message)
        const userCahe = getCache(message.userid)

        if(userCahe && userCahe.lastMessage === message.text) return

        if(await checkProgress(userCahe,message)) return

        try{
            const messageText = message.text

            const anonymous = getAnonymous(messageText)
            const to = getTo(messageText)
            const text = getTxt(messageText)
            const from =  `@${await getUsernameById(message.userid)}` 

            const tweet = {
                fromId: message.userid,
                anonymous,
                from,
                to,
                text
            }

            console.log(tweet)

            const hasAllFields = !(anonymous === '' || to === '' || text === '' || from === '')
            const fitOnTweet = checkFitOnTweet(tweet)
            const ispejorative = checkIsPejorative(tweet)

            if(!hasAllFields)
                await sendMessage(message.userid, msgError)
            if(!fitOnTweet)
                await sendMessage(message.userid, msgErrorTweetFit)
            if(ispejorative)
                await sendMessage(message.userid, msgErrorMessagePejorative)

            
            if(hasAllFields && fitOnTweet && !ispejorative){

                setCache({userid: message.userid, progress: 1, tweet, lastMessage: message.text})
                
                const tweetTxt = `${tweet.anonymous ? 'De: Anônimo' : 'De: ' + tweet.from} \nPara: ${tweet.to} \n${tweet.text}`
                await sendMessage(message.userid, msgWaitingConfirmation(tweetTxt))

                console.log(`New message from ${tweet.from}`)
                console.log(tweet)
                return
            }

        }catch(err){
            await sendMessage(message.userid, msgError)
        //    console.log(err + ' ERROO')
        }

        // setCache({userid: message.userid, lastMessage: message.text})
        leaveConversation(message.userid)
    });
}

async function checkProgress(userCahe, message){
    if(userCahe && userCahe.progress === 1){
        const text = message.text.toString().toLowerCase().replace('não', 'nao')

        if(text.includes('sim')){
            const tweet = userCahe.tweet
            addToTweetQueue(tweet)
            await sendMessage(message.userid, msgSucess)

        }else if(text.includes('nao')){
            await sendMessage(message.userid, msgNotConfirmed)

        } else{
            await sendMessage(message.userid, msgCantFindConfirmation)
            setCache({userid: message.userid, lastMessage: message.text})
            return true
        }
        
        leaveConversation(message.userid)
        removeCache(message.userid)
        return true
    }else{
        return false
    }
}


function getAnonymous(text){
    let anonymous = ''
    anonymous = text.split('\n')[0]
    anonymous = anonymous.toString().toLowerCase()
    anonymous = anonymous.replace('não', 'nao')
    anonymous = anonymous.replace('anônimo', '')
    anonymous = anonymous.replace('anonimo', '')
    anonymous = anonymous.replace(':', '')
    if(anonymous.includes('nao'))
        anonymous = false
    else if (anonymous.includes('sim'))
        anonymous = true
    else
        anonymous = ''
    
    return anonymous
}


function getTo(text){
    let to = ''
    to = text.split('\n')[1].toString().toLowerCase()
    to = to.replace('para:', '')
    to = to.replace(':', '')
    to = to.trim()
    if(to.includes(' ')){
        to.split(' ').forEach(element => {
            if(element.includes('@'))
                to = element
        });
    }
    to = to.includes('@') ? to : false
    return to
}

function getTxt(text){
    let txt = ''
    txt = text.split('\n')[2].toString().toLowerCase()
    txt = txt.replace('mensagem:', '')
    txt = txt.replace(':', '')
    txt = txt.trim()
    txt = txt.charAt(0).toUpperCase() + txt.slice(1);
    return txt
}

function checkFitOnTweet(tweet){
    const tweetTxt = `${tweet.anonymous ? 'De: Anônimo' : 'De: ' + tweet.from} \nPara: ${tweet.to} \n\n${tweet.text}`

    if(tweetTxt.length > 281)
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

function leaveConversation(id) {

    var headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://twitter.com/messages',
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': 'en',
        'x-twitter-active-user': 'yes',
        'x-csrf-token': `${leaveConversationCsrfToken}`,
        'Origin': 'https://twitter.com',
        'authorization': `Bearer ${leaveConversationBearerToken}`,
        'Connection': 'keep-alive',
        'Cookie': '_ga=GA1.2.368656014.1613186248; ads_prefs=HBISAAA=; kdt=ZFOJczgRMUMVPQxrStNCelZHDxg1oonJqtI1Na18; remember_checked_on=1; twid=u%3D1385255336899235840; auth_token=e610b399511619a4dcd0d40b6757363801868f57; night_mode=1; mbox=PC#0e5a29d325d547d7a7c986ffd00b8fa8.34_0#1683047964|session#07e21bbe16d0479684f2b9e61360d7c2#1619803693; dnt=1; auth_multi=2940913690:f1c399dad6b885ee144384a469f0d6537ff3dbb9; personalization_id=v1_2E9dK4nmK+3vFDAxRX2ZAw==; guest_id=v1%3A161911087742759822; ct0=754ce10c9c9e2cbc1a0ca4d9e02c823ca499b62c9a45450f46c27c1303348a24da4cad33eaf82139a1b2d41e1405132dc8902f33ec5b68719448540355060b195dee777d1af1f4883ce45359b340da42; des_opt_in=Y; cd_user_id=17904c418ff116-0de23d7941caa08-4c3f2c72-1fa400-17904c419007b2; external_referer=8e8t2xd8A2w%3D|0|ziZgIoZIK4nlMKUVLq9KcnBFms0d9TqBqrE%2FyjvSFlFJR45yIlYF%2Bw%3D%3D; _gid=GA1.2.2007011065.1620053201'
    };

    var dataString = 'cards_platform=Web-12&include_cards=1&include_ext_alt_text=true&include_quote_count=true&include_reply_count=1&tweet_mode=extended&dm_users=false&include_groups=true&include_inbox_timelines=true&include_ext_media_color=true&supports_reactions=true&include_conversation_info=true';

    var options = {
        url: `https://twitter.com/i/api/1.1/dm/conversation/${id}-1385255336899235840/delete.json`,
        method: 'POST',
        headers: headers,
        body: dataString
    };

    function callback(error, response, body) {
        if(error) { console.log(error)}
        if (!error && response.statusCode == 200) {
            // console.log(body);
        }
    }

    request(options, callback);

}

async function getReqRemaing() { // faço isso dps
    const reqRem = (await client.get('application/rate_limit_status')).data.resources.direct_messages

    const a = {
        list: reqRem['/direct_messages/events/list'],
        send: reqRem['/direct_messages/sent']
    }

    console.log(a)

    return a
        
}

// this is a SUPER gambirarra (if u dont know what it means, try to check on google)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}




