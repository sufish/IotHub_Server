var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Connection = require('./connection')
var DeviceACL = require("../models/device_acl")
const emqxService = require("../services/emqx_service")
const influxDBService = require("../services/influxdb_service")
const ObjectId = require('bson').ObjectID;


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
    last_status_update: Number,

    tags: {
        type: Array,
        default: []
    },

    tags_version: {
        type: Number,
        default: 1
    }
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
    let productName = username_arr[0];
    let deviceName = username_arr[1];
    this.findOne({product_name: productName, device_name: deviceName}, function (err, device) {
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
            influxDBService.writeConnectionData({
                productName: productName,
                deviceName: deviceName,
                connected: true,
                ts: event.connected_at
            })
        }
    })

}

deviceSchema.statics.removeConnection = function (event) {
    var username_arr = event.username.split("/")
    let productName = username_arr[0];
    let deviceName = username_arr[1];
    this.findOne({product_name: productName, device_name: deviceName}, function (err, device) {
        if (err == null && device != null) {
            Connection.findOneAndUpdate({client_id: event.client_id, device: device._id},
                {
                    connected: false,
                    disconnect_at: Math.floor(Date.now() / 1000)
                }, {useFindAndModify: false}).exec()
            influxDBService.writeConnectionData({
                productName: productName,
                deviceName: deviceName,
                connected: false
            })
        }
    })
}

deviceSchema.methods.getACLRule = function () {
    const publish = [
        `upload_data/${this.product_name}/${this.device_name}/+/+`,
        `update_status/${this.product_name}/${this.device_name}/+`,
        `cmd_resp/${this.product_name}/${this.device_name}/+/+/+`,
        `rpc_resp/${this.product_name}/${this.device_name}/+/+/+`,
        `get/${this.product_name}/${this.device_name}/+/+`
    ]
    const subscribe = [`tags/${this.product_name}/+/cmd/+/+/+/#`]
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


deviceSchema.post("remove", function (device, next) {
    Connection.deleteMany({device: device._id}).exec()
    DeviceACL.deleteMany({broker_username: device.broker_username}).exec()
    next()
})

deviceSchema.methods.sendCommand = function ({commandName, data, encoding = "plain", ttl = undefined, commandType = "cmd", qos = 1}) {
    return Device.sendCommand({
        productName: this.product_name,
        deviceName: this.device_name,
        commandName: commandName,
        data: data,
        encoding: encoding,
        ttl: ttl,
        commandType: commandType,
        qos: qos
    })
}

deviceSchema.statics.sendCommand = function ({productName, deviceName, commandName, data, encoding = "plain", ttl = undefined, commandType = "cmd", qos = 1}) {
    var requestId = new ObjectId().toHexString()
    var topic = `${commandType}/${productName}/${deviceName}/${commandName}/${encoding}/${requestId}`
    if (ttl != null) {
        topic = `${topic}/${Math.floor(Date.now() / 1000) + ttl}`
    }
    emqxService.publishTo({topic: topic, payload: data, qos: qos})
    return requestId
}

deviceSchema.methods.sendTags = function () {
    this.sendCommand({
        commandName: "$set_tags",
        data: JSON.stringify({tags: this.tags || [], tags_version: this.tags_version || 1}),
        qos: 0
    })
}

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;