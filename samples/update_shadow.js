require('dotenv').config({path: "../.env"})
const request = require("request")

var deviceUrl = `http://127.0.0.1:3000/devices/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}`;

var checkLights = function () {
    request.get(deviceUrl
        , function (err, response, body) {
            var shadow = JSON.parse(body).shadow
            var lightsStatus = "unknown"
            if(shadow.state.reported && shadow.state.reported.lights){
                lightsStatus = shadow.state.reported.lights
            }
            console.log(`current lights status is ${lightsStatus}`)
            setTimeout(checkLights, 2000)
        })
}
request.get(deviceUrl
    , function (err, response, body) {
        var deviceInfo = JSON.parse(body)
        request.put(`${deviceUrl}/shadow`, {
            json: {
                version: deviceInfo.shadow.version + 1,
                desired: {lights: "on"}
            }
        }, function (err, response, body) {
            checkLights()
        })
    })