import {Server as WebSocketServer} from 'ws';

export default function initialiseServer(port) {
    const wss = new WebSocketServer({ port});
    wss.on('connection', ws => {
        ws.on('message', function (message) {
            // Broadcast to all other clients
            wss.clients.forEach(client => {
                if (client !== this) {
                    client.send(message);
                }
            });
        });
    });
    return wss;
}
