require('dotenv').config()
var Twit = require('twit')
const { getTweetQueue, removeTweetQueue,saveHistory} = require('../cache-controller');

const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET

const client = new Twit({
    consumer_key: apiKey,
    consumer_secret: apiSecretKey,
    access_token: acessTokenKey,
    access_token_secret: acessTokenSecret,
})


module.exports = {
    async start(){
        console.log('✔️ Tweet Controller iniciado')
        while (true){
            try{
                const nextTweet = findNextTweet()
                if(nextTweet){
                    await tweet(nextTweet)

                    saveHistory(nextTweet)
                    removeTweetQueue() //remove the first tweet in queue
                }

            }catch(err){ console.log(err) }

            await sleep(60 * 1000)
        }
    }
}

function findNextTweet() {
    const tweetQueue = getTweetQueue()
    const nextTweet = tweetQueue[0]
    
    return nextTweet
}

async function tweet(tweet){
    const tweetTxt = `${tweet.anonymous ? '' : 'De: ' + tweet.from.toString().toLowerCase()} \nPara: ${tweet.to} \n${tweet.text}`

    const data = {
        status: tweetTxt
    }

    // client.post('statuses/update', data, (err,ttr,res) => {
    //     if(err){ console.log(err); return}
    //     console.log(ttr)
    // })

    console.log('=====TWITANDO======')
    console.log('' + data.status)
    console.log('===================')

    await sleep(500)
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
