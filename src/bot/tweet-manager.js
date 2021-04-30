require('dotenv').config()
var Twit = require('twit')


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
    start(){
        tweet({})
    }
}



function tweet(tweet){
    const tweetTxt = `${tweet.anonymous ? '' : 'De: ' + tweet.from} \nPara: ${tweet.to} \n${tweet.text}`

    const data = {
        status: tweetTxt
    }
    client.post('statuses/update', data, (err,ttr,res) => {
        if(err){ console.log(err); return}
        console.log(ttr)
    })
}
