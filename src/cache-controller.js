const fs = require('fs')

const cacheJsonPath = `${__dirname}\\message-cache.json`
const historyJsonPath = `${__dirname}\\history.json`
const tweetJsonPath = `${__dirname}\\tweet-cache.json`


module.exports = {
    setCache(cacheParams){
         const prevCache = JSON.parse(fs.readFileSync(`${cacheJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));

        let newCache = prevCache

        let hasUser = false

        newCache.forEach(element => {
            if(element.userid === cacheParams.userid)
            hasUser = true
        })


        hasUser ? newCache.forEach(element => {

            if(element.userid === cacheParams.userid){
                element.userid = cacheParams.userid
                element.progress = cacheParams.progress ? cacheParams.progress : element.progress
                element.to = cacheParams.to ? cacheParams.to : element.to
                element.text = cacheParams.text ? cacheParams.text : element.text
                element.anonymous = cacheParams.anonymous ? cacheParams.anonymous : element.anonymous
                element.lastMessage = cacheParams.lastMessage ? cacheParams.lastMessage : element.lastMessage
                element.username = cacheParams.username ? cacheParams.username : element.username
                element.tweet = cacheParams.tweet ? cacheParams.tweet : element.tweet
                // se tiver mais paremetros add depois
            }

        }) : newCache.push(cacheParams)


        fs.writeFileSync(`${cacheJsonPath}`, JSON.stringify(newCache), (err) => {
            if (err) 
                throw err;
            
        })

    },
    getCache(user){
        const cache = JSON.parse(fs.readFileSync(`${cacheJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;

            return data.toString()
        }))

        let userCache = false
        cache.forEach(element => {
            if(element.userid == user){ //tirei o toString, se pa n da nada mas n testei
                userCache = element
            }
        })

        return userCache
    },
    removeCache(user){
        const oldcache = JSON.parse(fs.readFileSync(`${cacheJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;

            return data.toString()
        }))

        const newCache = []

        oldcache.forEach(element => {
            if(element.userid !== user){
                newCache.push(element)
            }
        })

        fs.writeFileSync(`${cacheJsonPath}`, JSON.stringify(newCache), (err) => {
            if (err) {
                throw err;
            }
        })
    },
    saveHistory(tweet){
        const prevHistory = JSON.parse(fs.readFileSync(`${historyJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));
        
        prevHistory.push(tweet)


        fs.writeFileSync(`${historyJsonPath}`, JSON.stringify(prevHistory), (err) => {
            if (err) 
                throw err;
        })

        console.log('Mensagem de ' + tweet.from + ' salva com sucesso!')
    },
    addToTweetQueue(tweet){

        const tweetQueue = JSON.parse(fs.readFileSync(`${tweetJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));

        tweetQueue.push(tweet)

        fs.writeFileSync(`${tweetJsonPath}`, JSON.stringify(tweetQueue), (err) => {
            if (err) 
                throw err;
            
        })
    },
    getTweetQueue(){
        const tweetQueue = JSON.parse(fs.readFileSync(`${tweetJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));

        return tweetQueue
    },
    removeTweetQueue(){
        const tweetQueue = JSON.parse(fs.readFileSync(`${tweetJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));

        const newTweetQueue = []

        for(x = 1; x < tweetQueue.length; x++){
            newTweetQueue.push(tweetQueue[x])
        }
        
        fs.writeFileSync(`${tweetJsonPath}`, JSON.stringify(newTweetQueue), (err) => {
            if (err) 
                throw err;
            
        })
    }
}
