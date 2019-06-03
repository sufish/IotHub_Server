require('dotenv').config({path: "../.env"})
const request = require("request")
const buf = Buffer.alloc(4);
buf.writeUInt32BE(Math.floor(Date.now())/1000, 0);
var formData = {
    command: "ping",
    data: buf.toString("base64"),
    encoding: "base64",
    use_rpc: true
}
request.post(`http://127.0.0.1:3000/devices/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}/command`, {
    form: formData
}, function (error, response, body) {
    if (error) {
        console.log(error)
    } else {
        console.log('statusCode:', response && response.statusCode);
        var result = JSON.parse(body)
        if(result.error != null){
            console.log(result.error)
        }else{
            console.log('response:', Buffer.from(result.response, "base64").readUInt32BE(0));
        }
    }
})


