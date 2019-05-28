const bson = require('bson')
var amqp = require('amqplib/callback_api');
var uploadDataExchange = "iothub.events.upload_data"
var updateStatusExchange = "iothub.events.update_status"
var currentChannel = null;
amqp.connect(process.env.RABBITMQ_URL, function (error0, connection) {
    if (error0) {
        console.log(error0);
    } else {
        connection.createChannel(function (error1, channel) {
            if (error1) {
                console.log(error1)
            } else {
                currentChannel = channel;
                channel.assertExchange(uploadDataExchange, 'direct', {durable: true})
            }
        });
    }
});

class NotifyService {
    static notifyUploadData(message) {
        var data = bson.serialize({
            device_name: message.device_name,
            payload: message.payload,
            send_at: message.sendAt,
            data_type: message.dataType,
            message_id: message.message_id
        })
        if(currentChannel != null) {
            currentChannel.publish(uploadDataExchange, message.product_name, data, {
                persistent: true
            })
        }
    }

    static notifyUpdateStatus({productName, deviceName, deviceStatus}){
        var data = bson.serialize({
            device_name: deviceName,
            device_status: deviceStatus
        })
        if(currentChannel != null) {
            currentChannel.publish(updateStatusExchange, productName, data, {
                persistent: true
            })
        }
    }
}

module.exports = NotifyService