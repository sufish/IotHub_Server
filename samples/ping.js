require('dotenv').config({path: "../.env"})
const bson = require('bson')
const request = require("request")
var amqp = require('amqplib/callback_api');
var exchange = "iothub.events.cmd_resp"
amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log(error1)
            } else {
                channel.assertExchange(exchange, 'direct', {durable: true})
                var queue = "iotapp_cmd_resp";
                channel.assertQueue(queue, {
                    durable: true
                })
                channel.bindQueue(queue, exchange, process.env.TARGET_PRODUCT_NAME)
                channel.consume(queue, function (msg) {
                    var data = bson.deserialize(msg.content)
                    if(data.command == "ping") {
                        console.log(`received from ${data.device_name}, requestId: ${data.request_id},payload: ${data.payload.buffer.readUInt32BE(0)}`)
                    }
                    channel.ack(msg)
                })
            }
        });
    }
});

const buf = Buffer.alloc(4);
buf.writeUInt32BE(Math.floor(Date.now())/1000, 0);
var formData = {
    command: "ping",
    data: buf.toString("base64"),
    encoding: "base64"
}
if(process.argv[2] != null){
    formData.ttl = process.argv[2]
}
request.post(`http://127.0.0.1:3000/devices/${process.env.TARGET_PRODUCT_NAME}/${process.env.TARGET_DEVICE_NAME}/command`, {
    form: formData
}, function (error, response, body) {
    if (error) {
        console.log(error)
    } else {
        console.log('statusCode:', response && response.statusCode);
        console.log('body:', body);
    }
})


