const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL, {'return_buffers': true});
client.on("error", function (err) {
    console.log("Error " + err);
});
module.exports = client;
