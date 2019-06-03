const redisClient = require("../models/redis")
class UtilsService {
    static waitKey(key, ttl, callback) {
        var end = Date.now() + ttl * 1000
        function checkKey() {
            if (Date.now() < end) {
                redisClient.get(key, function (err, val) {
                    if (val != null) {
                        callback(val)
                    } else {
                        setTimeout(checkKey, 10)
                    }
                })
            } else {
                callback(null)
            }

        }
        checkKey()
    }
}

module.exports = UtilsService