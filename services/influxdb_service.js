const Influx = require('influx')
const influx = new Influx.InfluxDB({
    host: process.env.INFLUXDB,
    database: 'iothub',
    schema: [
        {
            measurement: 'device_connections',
            fields: {
                connected: Influx.FieldType.BOOLEAN
            },
            tags: [
                'product_name', 'device_name'
            ]
        },
        {
            measurement: 'connection_count',
            fields: {
                count: Influx.FieldType.INTEGER
            },
            tags: ["node_name"]
        }
    ]
})

class InfluxDBService {
    static writeConnectionData({productName, deviceName, connected, ts}) {
        var timestamp = ts == null ? Math.floor(Date.now() / 1000) : ts
        influx.writePoints([
            {
                measurement: 'device_connections',
                tags: {product_name: productName, device_name: deviceName},
                fields: {connected: connected},
                timestamp: timestamp
            }
        ], {
            precision: 's',
        }).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        })
    }

    static writeConnectionCount(nodeName, count) {
        influx.writePoints([
            {
                measurement: 'connection_count',
                tags: {node_name: nodeName},
                fields: {count: count},
                timestamp: Math.floor(Date.now() / 1000)
            }
        ], {
            precision: 's',
        }).catch(err => {
            console.error(`Error saving data to InfluxDB! ${err.stack}`)
        })
    }
}

module.exports = InfluxDBService