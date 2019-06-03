require('dotenv').config({path: "../.env"})
const bson = require('bson')
const request = require("request")
var amqp = require('amqplib/callback_api');
var exchange = "iothub.events.data_request"
amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log(error1)
            } else {
                channel.assertExchange(exchange, 'direct', {durable: true})
                var queue = "iotapp_data_request";
                channel.assertQueue(queue, {
                    durable: true
                })
                channel.bindQueue(queue, exchange, process.env.TARGET_PRODUCT_NAME)
                channel.consume(queue, function (msg) {
                    var data = bson.deserialize(msg.content)
                    if (data.resource == "weather") {
                        console.log(`received request for weather from ${data.device_name}`)
                        request.post(`http://127.0.0.1:3000/devices/${process.env.TARGET_PRODUCT_NAME}/${data.device_name}/command`, {
                            form: {
                                command: "weather",
                                data: JSON.stringify({temp: 25, wind: 4}),
                            }
                        }, function (error, response, body) {
                            if (error) {
                                console.log(error)
                            } else {
                                console.log('statusCode:', response && response.statusCode);
                                console.log('body:', body);
                            }
                        })
                    }
                    channel.ack(msg)
                })
            }
        });
    }
});



