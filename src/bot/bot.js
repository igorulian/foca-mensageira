require('dotenv').config()
const messageManager = require('./message-manager')
const tweetManager = require('./tweet-manager')


const apiKey = process.env.API_KEY
const apiSecretKey = process.env.API_SECRET_KEY
// const bearerToken = process.env.BEARER_TOKEN
const acessTokenKey = process.env.ACCESS_TOKEN_KEY
const acessTokenSecret = process.env.ACCESS_TOKEN_SECRET


module.exports = {
    start() {
        messageManager.start()
        tweetManager.start()
    }
}
