import {server as WebSocketServer} from 'ws';

export default function initialiseServer(port) {
    const wss = new WebSocketServer({ port});
    wss.on('connection', ws => {
        ws.on('message', message => {
            console.log('received: %s', message);
        });
        ws.send('something');
    });
}
