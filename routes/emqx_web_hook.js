var express = require('express');
var router = express.Router();
var Device = require("../models/device")
var messageService = require("../services/message_service")

router.post("/", function (req, res) {
    switch (req.body.action){
        case "client_connected":
            Device.addConnection(req.body)
            break
        case "client_disconnected":
            Device.removeConnection(req.body)
            break;
        case "message_publish":
            messageService.dispatchMessage({
                topic: req.body.topic,
                payload: new Buffer(req.body.payload, 'base64'),
                ts: req.body.ts
            })
    }
    res.status(200).send("ok")
})

module.exports = router
