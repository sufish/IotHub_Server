const redisClient = require("../models/redis")
const pathToRegexp = require('path-to-regexp')
const Message = require("../models/message")
const NotifyService = require("./notify_service")
const Device = require("../models/device")

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
        var statusTopicRule = "update_status/:productName/:deviceName/:messageId"
        var cmdRespRule = "cmd_resp/:productName/:deviceName/:commandName/:requestId/:messageId"
        const topicRegx = pathToRegexp(dataTopicRule)
        const statusRegx = pathToRegexp(statusTopicRule)
        const cmdRespRegx = pathToRegexp(cmdRespRule)
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
        } else if ((result = statusRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[3], function (isDup) {
                if (!isDup) {
                    MessageService.handleUpdateStatus({
                        productName: result[1],
                        deviceName: result[2],
                        deviceStatus: new Buffer(payload, 'base64').toString(),
                        ts: ts
                    })
                }
            })
        } else if ((result = cmdRespRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[5], function (isDup) {
                if (!isDup) {
                    MessageService.handleCommandResp({
                        productName: result[1],
                        deviceName: result[2],
                        ts: ts,
                        command: result[3],
                        requestId: result[4],
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
        NotifyService.notifyUploadData(message)
    }

    static handleUpdateStatus({productName, deviceName, deviceStatus, ts}) {
        Device.findOneAndUpdate({
                product_name: productName, device_name: deviceName,
                "$or": [{last_status_update: {"$exists": false}}, {last_status_update: {"$lt": ts}}]
            },
            {
                device_status: deviceStatus,
                last_status_update: ts
            }, {useFindAndModify: false}).exec(function (error, device) {
            if (device != null) {
                NotifyService.notifyUpdateStatus({
                    productName: productName,
                    deviceName: deviceName,
                    deviceStatus: deviceStatus
                })
            }
        })
    }

    static handleCommandResp({productName, deviceName, command, requestId, ts, payload}) {
        NotifyService.notifyCommandResp({
            productName: productName,
            deviceName: deviceName,
            command: command,
            requestId: requestId,
            ts: ts,
            payload: payload
        })
    }
}

module.exports = MessageService