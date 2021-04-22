require('dotenv').config()

module.exports = {
    start() {
        const lastMessages = getLastMessages() // get the last DM messages from twitter api 
        const analyzedMessages = analyzeMessages(lastMessages) // alanyze messages level 0,1,2,3,4... 
    }
}


async function getLastMessages() {

}

async function analyzeMessages(messages){
    // setLevel(user,value)
    // getLevel(user)
    // return with level
}

async function sendMessagesByLevel(analyzedMessages){
    // lvl 0 = introduct text
    // lvl 1 = check @ and if its ok, add to cache, up level, and send message explaint lvl 2
    // lvl 2 = cehck txt, and if its ok, send message to confirm @ and txt
    // lvl 3 = if its yes, tweet and reset, else back to lvl 1
}


