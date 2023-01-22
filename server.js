const express = require('express')
const server = express()
const hostname = '127.0.0.1';
const port = 3000;

const Traceroute = require('nodejs-traceroute');

server.use(express.json());
// app.use(express.urlencoded());

server.get('/', (req, res) => {
    res.send('Hello World!')
})

server.post('/traceroute', (req, res) => {
    console.log(req.body);

    let trace = [];

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