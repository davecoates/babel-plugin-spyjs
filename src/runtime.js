/* global window */
import { buildMirror, serialize } from 'value-mirror';
import { WebSocketMirrorServer } from 'value-mirror/lib/wsMirrorClient';

if (window && !window.__GLOBAL_FUNC_NAME__) {
    const ws = new WebSocketMirrorServer('__WS_ADDRESS__', __WS_PORT__);
    let queue = [];
    let isOpen = false;
    const clearQueue = () => {
        queue.forEach(payload => ws.send(payload));
        queue = [];
    }
    ws.ws.onopen = () => {
        isOpen = true;
        clearQueue();
    };
    window.__GLOBAL_FUNC_NAME__ = function(value, info) {
        try {
          const payload = {
              messageType: 'VALUE_UPDATE',
              payload: {
                  value: serialize(value),
                  info,
              },
          };
          if (isOpen) {
              ws.send(payload);
          } else {
              queue.push(payload);
          }
        } catch (err) {
          console.error('Failed to stringify', err, value, info); // eslint-disable-line
        }
        return value;
    };
}
