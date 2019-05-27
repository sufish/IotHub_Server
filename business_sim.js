require('dotenv').config()

const bson = require('bson')
var amqp = require('amqplib/callback_api');
var uploadDataExchange = "iothub.events.upload_data"
amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log(error1)
            } else {
                console.log("started")
                channel.assertExchange(uploadDataExchange, 'direct', {durable: true})
                var queue = "iotapp_upload_data";
                channel.assertQueue(queue, {
                    durable: true
                })
                channel.bindQueue(queue, uploadDataExchange, "IotApp")
                channel.consume(queue, function (msg) {
                    var data = bson.deserialize(msg.content)
                    console.log(`received from ${data.device_name}, messageId: ${data.message_id},payload: ${data.payload.toString()}`)
                    channel.ack(msg)
                })
            }
        });
    }
});