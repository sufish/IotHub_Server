const redisClient = require("../models/redis")
const pathToRegexp = require('path-to-regexp')
const Message = require("../models/message")

class MessageService {
    static checkMessageDuplication(messageId, callback) {
        var key = `/messageIDs/${messageId}`
        redisClient.setnx(key, "", function (err, res) {
            if (res == 1) {
                redisClient.expire(key, 60 * 60 * 6)
                callback.call(this, false)
            } else {
                callback.call(this, true)
            }
        })
    }

    static dispatchMessage({topic, payload, ts} = {}) {
        var dataTopicRule = "upload_data/:productName/:deviceName/:dataType/:messageId";
        const topicRegx = pathToRegexp(dataTopicRule)
        var result = null;
        if ((result = topicRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[4], function (isDup) {
                if (!isDup) {
                    MessageService.handleUploadData({
                        productName: result[1],
                        deviceName: result[2],
                        dataType: result[3],
                        messageId: result[4],
                        ts: ts,
                        payload: new Buffer(payload, 'base64')
                    })
                }
            })
        }
    }

    static handleUploadData({productName, deviceName, ts, payload, messageId, dataType} = {}) {
        var message = new Message({
            product_name: productName,
            device_name: deviceName,
            payload: payload,
            message_id: messageId,
            data_type: dataType,
            sent_at: ts
        })
        message.save()
    }
}

module.exports = MessageService