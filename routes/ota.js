var express = require('express');
var router = express.Router();
var Device = require("../models/device")
var OTAService = require("../services/ota_service")
router.post("/:productName/:deviceName", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    Device.findOne({product_name: productName, device_name: deviceName}, function (err, device) {
        if (err) {
            res.send(err)
        } else if (device != null) {
            OTAService.sendOTA({
                productName: device.product_name,
                deviceName: device.device_name,
                fileUrl: req.body.url,
                size: parseInt(req.body.size),
                md5: req.body.md5,
                version: req.body.version,
                type: req.body.type
            })
            res.status(200).send("ok")
        } else {
            res.status(400).send("device not found")
        }
    })
})

router.get("/:productName/:deviceName", function (req, res) {
    var productName = req.params.productName
    var deviceName = req.params.deviceName
    OTAService.getProgress(productName, deviceName, function (progress) {
        res.status(200).json(progress)
    })
})

module.exports = router