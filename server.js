const express = require('express')
const server = express()
const hostname = 'localhost';
const port = 3000;
const cors = require('cors');

const Traceroute = require('nodejs-traceroute');
const geoip = require('geoip-lite');


server.use(express.json());
// app.use(express.urlencoded());

server.use(cors());

server.get('/', (req, res) => {
    res.send('Hello World!')
})

server.post('/traceroute', (req, res) => {
    console.log(req.body);

    let trace = [];
    let withGeoLocations = req.body.withGeoLocations ?? false;

    console.log(withGeoLocations);

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
            .on('close', (code) => {
                console.log(`close: code ${code}`);
                let exception = (code !== 0) ? `Exited with code ${code}` : null;

                res.send({
                    exception: exception,
                    data: trace
                });
            });

        tracer.trace(req.body.target);
    } catch (ex) {
        console.log(ex);
        res.status(400);
        res.send({
            exception: ex,
            data: trace
        });
    }
})

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
})