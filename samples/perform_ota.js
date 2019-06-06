require('dotenv').config({path: "../.env"})
const request = require("request")
var otaData = {
    type: "firmware",
    url: "http://test.com/firmware/1.1.pkg",
    version: "1.1",
    size: 1000,
    md5: "abcd"
}
var progress = 0
var checkUpgradeProgress = function () {
    if (progress < 100) {
        request.get(`http://127.0.0.1:3000/ota/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}`, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                var info = JSON.parse(body);
                if(info.version == otaData.version) {
                    progress = info.progress
                    console.log(`current progress:${progress}%`);
                }
                setTimeout(checkUpgradeProgress, 1000)
            }
        })
    } else {
        request.get(`http://127.0.0.1:3000/devices/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}`, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                var info = JSON.parse(body);
                console.log(`current version:${info.device_status.firmware_ver}`);
                if (info.device_status.firmware_ver == otaData.version) {
                    console.log(`upgrade completed`);
                } else {
                    setTimeout(checkUpgradeProgress, 1000)
                }
            }
        })
    }
}

console.log("perform upgrade")
request.post(`http://127.0.0.1:3000/ota/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}`, {
    form: otaData
}, function (error, response) {
    if (error) {
        console.log(error)
    } else {
        console.log('statusCode:', response && response.statusCode);
        checkUpgradeProgress()
    }
})


