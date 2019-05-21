var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const connectionSchema = new Schema({
    connected: Boolean,
    client_id: String,
    keepalive: Number,
    ipaddress: String,
    proto_ver: Number,
    connected_at: Number,
    disconnect_at: Number,
    conn_ack: Number,
    device: {type: Schema.Types.ObjectId, ref: 'Device'}
})

connectionSchema.methods.toJSONObject = function () {
    return {
        connected: this.connected,
        client_id: this.client_id,
        ipaddress: this.ipaddress,
        connected_at: this.connected_at,
        disconnect_at: this.disconnect_at
    }
}

const Connection = mongoose.model("Connection", connectionSchema);

module.exports = Connection
