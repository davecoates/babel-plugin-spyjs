window.__GLOBAL_FUNC_NAME__ = function(value, info) {
    console.log('YO', value, info);
    const {a = 5} = {};
    const b = () => console.log('hah');
    return value;
};
