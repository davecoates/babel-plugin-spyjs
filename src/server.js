import {Server as WebSocketServer} from 'ws';

export default function initialiseServer(port) {
    const wss = new WebSocketServer({ port});
    console.log("SERVER");
    wss.on('connection', ws => {
        console.log("CONNECTION")
        ws.on('message', function (message) {
            console.log('!eceived and going to resend', message);
            // Broadcast to all other clients
            wss.clients.forEach(client => {
                if (client !== this) {
                    client.send(message)
                }
            });
        });
        //setInterval(() => ws.send('hahah!'), 5000);
    });
    return wss;
}
