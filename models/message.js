var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const messageSchema = new Schema({
    message_id: String,
    product_name: String,
    device_name: String,
    data_type: String,
    payload: Buffer,
    sent_at: Number
})

const Message = mongoose.model("Message", messageSchema);

module.exports = Message
