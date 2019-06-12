require('dotenv').config()
const bson = require('bson')
var mongoose = require('mongoose');
var amqp = require('amqplib/callback_api');
var messageService = require("./services/message_service")
var Device = require("./models/device")
mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true })

var addHandler = function (channel, queue, event, handlerFunc) {
    var exchange = "mqtt.events"
    channel.assertQueue(queue, {
        durable: true
    })
    channel.bindQueue(queue, exchange, event)
    channel.consume(queue, function (msg) {
        handlerFunc(bson.deserialize(msg.content))
        channel.ack(msg)
    })
}
amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log(error1)
            } else {
                addHandler(channel, "iothub_client_connected", "client.connected", function (event) {
                    event.connected_at = Math.floor(event.connected_at / 1000)
                    Device.addConnection(event)
                })
                addHandler(channel, "iothub_client_disconnected", "client.disconnected", function (event) {
                    Device.removeConnection(event)
                })
                addHandler(channel, "iothub_message_publish", "message.publish", function (event) {
                    messageService.dispatchMessage({
                        topic: event.topic,
                        payload: event.payload,
                        ts: Math.floor(event.pubished_at / 1000)
                    })
                })
            }
        });
    }
});