const express = require('express')
const server = express()
const hostname = 'localhost';
const port = 3000;
const cors = require('cors');

const Traceroute = require('nodejs-traceroute');
const geoip = require('geoip-lite');
const http = require('http');

server.use(express.json());
// app.use(express.urlencoded());

server.use(cors());

let geoLocationCurrentIP;
getPublicIp().then(function (ip) {
    let geoLocationData = geoip.lookup(ip);
    geoLocationData.ip = ip;
    console.log("GeoLocation data:");
    console.log(geoLocationData);
    geoLocationCurrentIP = geoLocationData;
});

server.get('/', (req, res) => {
    res.send('Traceroute Server')
})

server.post('/traceroute', (req, res) => {
    let trace = [];
    let withGeoLocations = req.body.withGeoLocations ?? false;
    console.log(`withGeoLocations: ${withGeoLocations}`);
    console.log(req.body);

    try {
        const tracer = new Traceroute();

        tracer
            .on('pid', (pid) => {
                console.log(`pid: ${pid}`);
            })
            .on('destination', (destination) => {
                console.log(`destination: ${destination}`);
            })
            .on('hop', (hop) => {
                trace.push(hop);
                console.log(`hop: ${JSON.stringify(hop)}`);

                if (withGeoLocations) {
                    hop.geolocations = (hop.ip === '*') ? null : geoip.lookup(hop.ip);
                }
            })
            .on('close', async (code) => {
                console.log(`close: code ${code}`);
                let exception = (code !== 0) ? `Exited with code ${code}` : null;

                res.send({
                    exception: exception,
                    data: trace,
                    currentGeoLocation: withGeoLocations ? geoLocationCurrentIP : null
                });
            });

        tracer.trace(req.body.target);
    } catch (exception) {
        console.log(exception);
        res.status(400);
        res.send({
            exception: exception
        });
    }
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})

function getPublicIp() {
    return new Promise(resolve => {
        http.get({'host': 'api.ipify.org', 'port': 80, 'path': '/'}, function (resp) {
            resp.on('data', function (ip) {
                console.log("Public IP address: " + ip);
                resolve(`${ip}`);
            });
        });
    });
}

