function something () {
    var a = [1,2,3].map(() => {
        for (let a of [1,2,3]) {
            console.log('hah!');
        }
    });

    var start = 'yep';

    const b = {
        string: 'ok',
        number: 5,
        symbol: Symbol.for('a'),
        fn: somethingElse(),
        iife: (function() { return 5; }()),
    };
}

function somethingElse() {
}
