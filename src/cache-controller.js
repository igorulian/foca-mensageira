const fs = require('fs')

// module.exports = {
    async function setCache(cacheParams){

         const prevCache = fs.readFileSync('cache.json', 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            

            return JSON.parse(data.toString());
        });

        let newCache = JSON.parse(prevCache)

        let hasUser = false

        newCache.forEach(element => {
            console.log(element)
            if(element.user === cacheParams.user)
            hasUser = true
        });


        hasUser ? newCache.forEach(element => {

            if(element.user === cacheParams.user){
                element.user = cacheParams.user
                element.level = cacheParams.level
                element.from = cacheParams.from
                element.to = cacheParams.to
                // se tiver mais paremetros add depois
            }

        }) : newCache.push(cacheParams)


        fs.writeFileSync('cache.json', JSON.stringify(newCache), (err) => {
            if (err) 
                throw err;
            
        });

    }
    function getCache(user){
        const cache = JSON.parse(fs.readFileSync('cache.json', 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            

            return JSON.parse(data.toString());
        }))

        let userCache = false
        cache.forEach(element => {
            if(element.user == user){ //tirei o toString, se pa n da nada mas n testei
                userCache = element
            }
            
        });

        return userCache
    }
    function removeCache(user){
        const oldcache = JSON.parse(fs.readFileSync('cache.json', 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) 
                throw err;
            

            return JSON.parse(data.toString());
        }))

        const newCache = []

        oldcache.forEach(element => {
            if(element.user !== user){
                newCache.push(element)
            }
        });

        fs.writeFileSync('cache.json', JSON.stringify(newCache), (err) => {
            if (err) {
                throw err;
            }
        });
    }


// setCache({
//     "user": "igorulian",
//     "level": 4,
//     "from": "anao",
//     "to": "grandao",
//     "text": "ta frio ai em cima?"
// })