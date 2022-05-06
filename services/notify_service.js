const bson = require('bson')
var amqp = require('amqplib/callback_api');
var uploadDataExchange = "iothub.events.upload_data"
var updateStatusExchange = "iothub.events.update_status"
var commandRespExchange = "iothub.events.cmd_resp"
var dataRequestRespExchange = "iothub.events.data_request"
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
                channel.assertExchange(updateStatusExchange, 'direct', {durable: true})
                channel.assertExchange(commandRespExchange, 'direct', {durable: true})
                channel.assertExchange(dataRequestRespExchange, 'direct', {durable: true})
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

    static notifyCommandResp({productName, deviceName, command, requestId, ts, payload}){
        var data = bson.serialize({
            device_name: deviceName,
            command: command,
            request_id: requestId,
            send_at: ts,
            payload: payload
        })
        if(currentChannel != null){
            currentChannel.publish(commandRespExchange, productName, data)
        }
    }

    static notifyDataRequest({productName, deviceName, resource, payload}){
        var data = bson.serialize({
            device_name: deviceName,
            resource: resource,
            payload: payload
        })
        if(currentChannel != null){
            currentChannel.publish(dataRequestRespExchange, productName, data)
        }
    }
}

module.exports = NotifyService
