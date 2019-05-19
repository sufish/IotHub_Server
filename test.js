var mongoose = require('mongoose');
var Device = require("./models/device")

mongoose.connect('mongodb://iot:iot@localhost:27017/iothub', { useNewUrlParser: true })

device = new Device({
    product_name: "product_name",
    device_name: "device_name",
    secret: "secret",
    broker_username: "username"
})

device.save(function () {
    mongoose.connection.close()
})

