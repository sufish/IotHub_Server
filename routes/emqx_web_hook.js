var express = require('express');
var router = express.Router();
var Device = require("../models/device")

router.post("/", function (req, res) {
    if (req.body.action == "client_connected") {
        Device.addConnection(req.body)
    }else if(req.body.action == "client_disconnected"){
        Device.removeConnection(req.body)
    }
    res.status(200).send("ok")
})

module.exports = router
