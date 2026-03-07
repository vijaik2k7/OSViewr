const WebSocket = require('ws');
const apiKey = 'ae259947999b6e917d4f44d7463566d295446213';

console.log("Connecting to wss://stream.aisstream.io/v0/stream...");
const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

socket.on('open', function open() {
    console.log('Connected!');

    const subscriptionMessage = {
        APIKey: apiKey,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport"]
    };
    socket.send(JSON.stringify(subscriptionMessage));
    console.log("Subscription sent.");
});

socket.on('message', function incoming(data) {
    console.log('Received message:', JSON.parse(data));
    socket.close(); // just need to verify one message
});

socket.on('error', function error(err) {
    console.error('WebSocket Error:', err);
});

socket.on('close', function close() {
    console.log('Disconnected.');
});
