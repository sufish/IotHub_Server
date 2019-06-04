var express = require('express');
var router = express.Router();
const emqxService = require("../services/emqx_service")
const ObjectId = require('bson').ObjectID;

router.post("/:productName/:tag/command", function (req, res) {
    var productName = req.params.productName
    var ttl = req.body.ttl != null ? parseInt(req.body.ttl) : null
    var commandName = req.body.command
    var encoding = req.body.encoding || "plain"
    var data = req.body.data
    var requestId = new ObjectId().toHexString()
    var topic = `tags/${productName}/${req.params.tag}/cmd/${commandName}/${encoding}/${requestId}`
    if (ttl != null) {
        topic = `${topic}/${Math.floor(Date.now() / 1000) + ttl}`
    }
    emqxService.publishTo({topic: topic, payload: data})
    res.status(200).json({request_id: requestId})
})
module.exports = router