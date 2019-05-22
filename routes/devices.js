var express = require('express');
var Device = require("../models/device")
var shortid = require("shortid")
var router = express.Router();
var Connection = require('./connection')


router.post("/", function (req, res) {
    var productName = req.body.product_name
    var deviceName = shortid.generate();
    var secret = shortid.generate();
    var brokerUsername = `${deviceName}@${productName}`

    var device = new Device({
        product_name: productName,
        device_name: deviceName,
        secret: secret,
        broker_username: brokerUsername,
        status: "active"
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
    Device.findOne({"product_name": productName, "device_name": deviceName}).exec(function (err, device) {
        if (err) {
            res.send(err)
        } else {
            if (device != null) {
                Connection.find({device: device._id}, function (_, connections) {
                    res.json(Object.assign(device.toJSONObject(), {
                        connections: connections.map(function (conn) {
                            return conn.toJSONObject()
                        })
                    }))
                })
            } else {
                res.status(404).json({error: "Not Found"})
            }
        }
    })
})

router.delete("/:productName/:deviceName", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    Device.findOne({"product_name": productName, "device_name": deviceName}).exec(function (err, device) {
        if (err) {
            res.send(err)
        } else {
            if (device != null) {
                device.disconnect()
                device.remove()
                res.status(200).send("ok")
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

router.put("/:productName/:deviceName/suspend", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    Device.findOneAndUpdate({"product_name": productName, "device_name": deviceName},
        {status: "suspended"}, {useFindAndModify: false}).exec(function (err, device) {
        if (err) {
            res.send(err)
        } else {
            if (device != null) {
                device.disconnect()
            }
            res.status(200).send("ok")
        }
    })
})

router.put("/:productName/:deviceName/resume", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    Device.findOneAndUpdate({"product_name": productName, "device_name": deviceName},
        {status: "active"}, {useFindAndModify: false}).exec(function (err) {
        if (err) {
            res.send(err)
        } else {
            res.status(200).send("ok")
        }
    })
})

module.exports = router