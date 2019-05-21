"use strict";
const request = require('request');

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
}

module.exports = EMQXService