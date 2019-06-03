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
        var cmdRespRule = "(cmd_resp|rpc_resp)/:productName/:deviceName/:commandName/:requestId/:messageId"
        var dataRequestTopicRule = "get/:productName/:deviceName/:resource/:messageId"
        const topicRegx = pathToRegexp(dataTopicRule)
        const statusRegx = pathToRegexp(statusTopicRule)
        const cmdRespRegx = pathToRegexp(cmdRespRule)
        const dataRequestRegx = pathToRegexp(dataRequestTopicRule)
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
                        payload: payload
                    })
                }
            })
        } else if ((result = statusRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[3], function (isDup) {
                if (!isDup) {
                    MessageService.handleUpdateStatus({
                        productName: result[1],
                        deviceName: result[2],
                        deviceStatus: payload.toString(),
                        ts: ts
                    })
                }
            })
        } else if ((result = cmdRespRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[6], function (isDup) {
                if (!isDup) {
                    if (result[1] == "rpc_resp") {
                        var key = `cmd_resp/${result[5]}`;
                        redisClient.set(key, payload)
                        redisClient.expire(key, 5)
                    } else {
                        MessageService.handleCommandResp({
                            productName: result[2],
                            deviceName: result[3],
                            ts: ts,
                            command: result[4],
                            requestId: result[5],
                            payload: payload
                        })
                    }
                }
            })
        } else if ((result = dataRequestRegx.exec(topic)) != null) {
            this.checkMessageDuplication(result[4], function (isDup) {
                if (!isDup) {
                    MessageService.handleDataRequest({
                        productName: result[1],
                        deviceName: result[2],
                        resource: result[3],
                        payload: payload,
                        ts: ts
                    })
                }
            })
        }
    }

    static handleDataRequest({productName, deviceName, resource, payload, ts}) {
        if (resource.startsWith("$")) {
            if (resource == "$ntp") {
                this.handleNTP({
                    payload: JSON.parse(payload.toString()),
                    ts: ts,
                    productName: productName,
                    deviceName: deviceName
                })
            }
        } else {
            NotifyService.notifyDataRequest({
                productName: productName,
                deviceName: deviceName,
                resource: resource,
                payload: payload
            })
        }
    }

    static handleNTP({payload, ts, productName, deviceName}) {
        var data = {
            device_time: payload.device_time,
            iothub_recv: ts * 1000,
            iothub_send: Date.now()
        }
        Device.sendCommand({
            productName: productName,
            deviceName: deviceName,
            data: JSON.stringify(data),
            commandName: "$set_ntp"
        })
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