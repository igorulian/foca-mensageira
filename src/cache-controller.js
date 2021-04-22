const fs = require('fs')

// module.exports = {
    async function setCache(cacheParams){

         const prevCache = fs.readFileSync('cache.json', 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) {
                throw err;
            }

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
                // se tiver mais paremetros add depois
            }

        }) : newCache.push(cacheParams)


        fs.writeFileSync('cache.json', JSON.stringify(newCache), (err) => {
            if (err) {
                throw err;
            }
        });

    }
    function getCache(user){
        const cache = fs.readFileSync('cache.json', 'utf-8', (err, data) => {  // na real tem que ler de um array, mas dps faço isso
            if (err) {
                throw err;
            }

            return JSON.parse(data.toString());
        });

        const jsonCache = JSON.parse(cache)
        let userCache = false

        jsonCache.forEach(element => {
            if(element.user.toString() == user.toString()){
                userCache = element
            }
            
        });

        return userCache

    }
