import WebScket from 'ws';
if (window && !window.__GLOBAL_FUNC_NAME__) {
    const ws = new WebScket('__WS_ADDRESS__');
    const queue = [];
    let isOpen = false;
    const clearQueue = () => queue.map(payload => ws.send(payload));
    ws.onopen = () => {
        isOpen = true;
        clearQueue();
    };
    window.HAHA = ws;
    console.log('__GLOBAL_FUNC_NAME__')
    window.__GLOBAL_FUNC_NAME__ = function(value, info) {
        console.log('YO??', value, info);
        console.log(JSON.stringify({value, info}));
        const payload = JSON.stringify({value, info});
        if (isOpen) {
            ws.send(payload);
        } else {
            queue.push(payload);
        }
        return value;
    };
}
