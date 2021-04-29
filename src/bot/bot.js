require('dotenv').config()
const messageManager = require('./message-manager')
const tweetManager = require('./tweet-manager')


module.exports = {
    start() {
        messageManager.start()
        // tweetManager.start()
    }
}
