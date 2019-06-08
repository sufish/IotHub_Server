var mqtt = require('mqtt')
var InfluxDbService = require("./services/influxdb_service")
const pathToRegexp = require('path-to-regexp')
var client = mqtt.connect('mqtt://127.0.0.1:11883')
client.on('connect', function () {
    client.subscribe("$queue/$SYS/brokers/+/stats/connections/count")
})

client.on('message', function (topic, message) {
    var result
    var countRule = pathToRegexp("$SYS/brokers/:nodeName/stats/connections/count")
    if((result = countRule.exec(topic)) != null){
        InfluxDbService.writeConnectionCount(result[1], parseInt(message.toString()))
    }
})