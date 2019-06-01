"use strict";
const request = require('request');
var shortid = require("shortid")

class EMQXService {
    static disconnectClient(clientId) {
        const apiUrl = `${process.env.EMQX_API_URL}/connections/${clientId}`
        request.delete(apiUrl, {
            "auth": {
                'user': process.env.EMQX_APP_ID,
                'pass': process.env.EMQX_APP_SECRET,
                'sendImmediately': true
            }
        }, function (error, response, body) {
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        })
    }

    static publishTo({topic, payload, qos = 1, retained = false}) {
        const apiUrl = `${process.env.EMQX_API_URL}/mqtt/publish`
        request.post(apiUrl, {
            "auth": {
                'user': process.env.EMQX_APP_ID,
                'pass': process.env.EMQX_APP_SECRET,
                'sendImmediately': true
            },
            json:{
                topic: topic,
                payload: payload,
                qos: qos,
                retained: retained,
                client_id: shortid.generate()
            }
        }, function (error, response, body) {
            console.log(`published to ${topic}`)
            console.log('statusCode:', response && response.statusCode);
            console.log('body:', body);
        })
    }
}

module.exports = EMQXService