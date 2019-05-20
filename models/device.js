var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    }
})

deviceSchema.methods.toJSONObject = function () {
    return {
        product_name: this.product_name,
        device_name: this.device_name,
        secret: this.secret
    }
}

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;