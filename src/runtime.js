/* global window, CircularJSON */
import WebSocket from 'ws';

if (window && !window.__GLOBAL_FUNC_NAME__) {
    const ws = new WebSocket('__WS_ADDRESS__');
    const queue = [];
    let isOpen = false;
    const clearQueue = () => queue.map(payload => ws.send(payload));
    ws.onopen = () => {
        isOpen = true;
        clearQueue();
    };
    window.__GLOBAL_FUNC_NAME__ = function(value, info) {
        try {
          const payload = CircularJSON.stringify({
              messageType: 'VALUE_UPDATE',
              payload: {value, info},
          });
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
