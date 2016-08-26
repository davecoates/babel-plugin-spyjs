/* @flow */
import {Server as WebSocketServer} from 'ws';
import messageTypes from './messageTypes';

type MessageHandler = (payload:Object) => void;

type MessageHandlers = {
    [key:$Keys<typeof messageTypes>]: MessageHandler //eslint-disable-line no-undef
}

export default function initialiseServer(port:number, handlers:MessageHandlers) : WebSocketServer {
    const wss = new WebSocketServer({ port });
    wss.on('connection', ws => {
        ws.on('message', function (message) {
            try {
                const action = JSON.parse(message);
                const { messageType, payload } = action;
                if (!messageTypes[messageType]) {
                    //console.error(`Unknown message of type '${messageType} reeived. It has been ignored.'`)
                    //return;
                } else {
                    if (handlers[messageType]) {
                        handlers[messageType](payload);
                    }
                }
                /*
                if (payload && payload.action === 'watchFile') {
                    touch(payload.path);
                }
                */
            } catch (err) {
                console.error('F?ailed to decode message', message, err); // eslint-disable-line
            }
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
