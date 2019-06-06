const redisClient = require("../models/redis")
const Device = require("../models/device")

class OTAService {
    static updateProgress(productName, deviceName, progress) {
        redisClient.set(`ota_progress/${productName}/${deviceName}`, JSON.stringify(progress))
    }

    static sendOTA({productName, deviceName = null, tag = null, fileUrl, version, size, md5, type}) {
        var data = JSON.stringify({
            url: fileUrl,
            version: version,
            size: size,
            md5: md5,
            type: type
        })
        if (deviceName != null) {
            Device.sendCommand({
                productName: productName,
                deviceName: deviceName,
                commandName: "$ota_upgrade",
                data: data
            })
        } else if (tag != null) {
            Device.sendCommandByTag({
                productName: productName,
                tag: tag,
                commandName: "$ota_upgrade",
                data: data
            })
        }
    }

    static getProgress(productName, deviceName, callback) {
        redisClient.get(`ota_progress/${productName}/${deviceName}`, function (err, value) {
            if (value != null) {
                callback(JSON.parse(value))
            } else {
                callback({})
            }
        })
    }
}

module.exports = OTAService