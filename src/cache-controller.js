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
                element.level = cacheParams.level ? cacheParams.level : element.level
                element.to = cacheParams.to ? cacheParams.to : element.to
                element.text = cacheParams.text ? cacheParams.text : element.text
                element.anonymous = cacheParams.anonymous ? cacheParams.anonymous : element.anonymous
                element.lastMessage = cacheParams.lastMessage ? cacheParams.lastMessage : element.lastMessage
                element.username = cacheParams.username ? cacheParams.username : element.username
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

        console.log('Mensagem de ' + tweet.username + ' salva com sucesso!')
    },
    addToTweetCache(tweet){

        const prevCache = JSON.parse(fs.readFileSync(`${tweetJsonPath}`, 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            
            return data.toString()
        }));

        prevCache.push(tweet)

        fs.writeFileSync(`${tweetJsonPath}`, JSON.stringify(prevCache), (err) => {
            if (err) 
                throw err;
            
        })
    }
}


// setCache({
//     "user": "igorulian",
//     "level": 4,
//     "from": "anao",
//     "to": "grandao",
//     "text": "ta frio ai em cima?"
// })