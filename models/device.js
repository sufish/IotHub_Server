var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Connection = require('./connection')

const deviceSchema = new Schema({
    //ProductName
    product_name: {
        type: String,
        required: true
    },
    //DeviceName
    device_name: {
        type: String,
        required: true,
    },
    //接入EMQX时使用的username
    broker_username: {
        type: String,
        required: true
    },
    //secret
    secret: {
        type: String,
        required: true,
    },

    //可接入状态
    status: String
})

deviceSchema.methods.toJSONObject = function () {
    return {
        product_name: this.product_name,
        device_name: this.device_name,
        secret: this.secret
    }
}

deviceSchema.statics.addConnection = function (event) {
    var username_arr = event.username.split("@")
    this.findOne({product_name: username_arr[1], device_name: username_arr[0]}, function (err, device) {
        if (err == null && device != null) {
            Connection.findOneAndUpdate({
                client_id: event.client_id,
                device: device._id
            }, {
                connected: true,
                client_id: event.client_id,
                keepalive: event.keepalive,
                ipaddress: event.ipaddress,
                proto_ver: event.proto_ver,
                connected_at: event.connected_at,
                conn_ack: event.conn_ack,
                device: device._id
            }, {upsert: true, useFindAndModify: false, new: true}).exec()
        }
    })

}

deviceSchema.statics.removeConnection = function (event) {
    var username_arr = event.username.split("@")
    this.findOne({product_name: username_arr[1], device_name: username_arr[0]}, function (err, device) {
        if (err == null && device != null) {
            Connection.findOneAndUpdate({client_id: event.client_id, device: device._id},
                {
                    connected: false,
                    disconnect_at: Math.floor(Date.now() / 1000)
                }, {useFindAndModify: false}).exec()
        }
    })
}

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;