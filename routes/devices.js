var express = require('express');
var Device = require("../models/device")
var shortid = require("shortid")
var router = express.Router();

router.post("/", function (req, res) {
    var productName = req.body.product_name
    var deviceName = shortid.generate();
    var secret = shortid.generate();
    var brokerUsername = `${deviceName}@${productName}`

    var device = new Device({
        product_name: productName,
        device_name: deviceName,
        secret: secret,
        broker_username: brokerUsername
    })

    device.save(function (err) {
        if (err) {
            res.status(500).send(err)
        } else {
            res.json({product_name: productName, device_name: deviceName, secret: secret})
        }
    })
})

router.get("/:productName/:deviceName", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    Device.findOne({"product_name": productName, "device_name": deviceName}, function (err, device) {
        if (err) {
            res.send(err)
        } else {
            if (device != null) {
                res.json(device.toJSONObject())
            } else {
                res.status(404).json({error: "Not Found"})
            }
        }
    })
})

router.get("/:productName", function (req, res) {
    var productName = req.params.productName
    Device.find({"product_name": productName}, function (err, devices) {
        if (err) {
            res.send(err)
        } else {
            res.json(devices.map(function (device) {
                return device.toJSONObject()
            }))

        }
    })
})

module.exports = router