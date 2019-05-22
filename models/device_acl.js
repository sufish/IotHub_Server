var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const deviceACLSchema = new Schema({
    broker_username: String,
    publish: Array,
    subscribe: Array,
    pubsub: Array,
}, { collection: 'device_acl' })

const DeviceACL = mongoose.model("DeviceACL", deviceACLSchema);

module.exports = DeviceACL
