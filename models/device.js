var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Connection = require('./connection')
var DeviceACL = require("../models/device_acl")
const emqxService = require("../services/emqx_service")


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
    status: String,

    device_status: String,
    last_status_update: Number
})

deviceSchema.methods.toJSONObject = function () {
    return {
        product_name: this.product_name,
        device_name: this.device_name,
        secret: this.secret,
        device_status: JSON.parse(this.device_status)
    }
}

deviceSchema.statics.addConnection = function (event) {
    var username_arr = event.username.split("/")
    this.findOne({product_name: username_arr[0], device_name: username_arr[1]}, function (err, device) {
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
    var username_arr = event.username.split("/")
    this.findOne({product_name: username_arr[0], device_name: username_arr[1]}, function (err, device) {
        if (err == null && device != null) {
            Connection.findOneAndUpdate({client_id: event.client_id, device: device._id},
                {
                    connected: false,
                    disconnect_at: Math.floor(Date.now() / 1000)
                }, {useFindAndModify: false}).exec()
        }
    })
}

deviceSchema.methods.getACLRule = function () {
    const publish = [
        `upload_data/${this.product_name}/${this.device_name}/+/+`,
        `update_status/${this.product_name}/${this.device_name}/+`
    ]
    const subscribe = []
    const pubsub = []
    return {
        publish: publish,
        subscribe: subscribe,
        pubsub: pubsub
    }
}

deviceSchema.methods.disconnect = function () {
    Connection.find({device: this._id}).exec(function (err, connections) {
        connections.forEach(function (conn) {
            emqxService.disconnectClient(conn.client_id)
        })
    })
}

deviceSchema.post("save", function (device, next) {
    var aclRule = device.getACLRule()
    var deviceACL = new DeviceACL({
        broker_username: device.broker_username,
        publish: aclRule.publish,
        subscribe: aclRule.subscribe,
        pubsub: aclRule.pubsub
    })
    deviceACL.save(function () {
        next()
    })
})

deviceSchema.post("remove", function (device, next) {
    Connection.deleteMany({device: device._id}).exec()
    DeviceACL.deleteMany({broker_username: device.broker_username}).exec()
    next()
})

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;