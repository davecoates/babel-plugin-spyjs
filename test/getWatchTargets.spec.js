import getWatchTargets from '../src/getWatchTargets';
import assert from 'assert';

const source = `function something () {
var a = [1,2,3].map(() => {
for (let a of [1,2,3]) {
console.log('hah!');
}
})
}

function somethingElse() {
}
`;

describe('getWatchTargets', () => {

    it('should find target at line and column', () => {
        let result = getWatchTargets(source, {line: 4, column: 15});
        assert(result, 'Result not found');
        assert.equal(result.type, 'StringLiteral');
        assert.equal(result.node.value, 'hah!');

        result = getWatchTargets(source, {line: 4, column: 10});
        assert(result, 'Result not found');
        assert.equal(result.type, 'Identifier');
        assert.equal(result.node.name, 'log');

        result = getWatchTargets(source, {line: 4, column: 7});
        assert(result, 'Result not found');
        assert.equal(result.type, 'Identifier');
        assert.equal(result.node.name, 'console');


        result = getWatchTargets(source, {line: 3, column: 15});
        assert(result, 'Result not found');
        assert.equal(result.type, 'NumericLiteral');
        assert.equal(result.node.value, 1);

        result = getWatchTargets(source, {line: 3, column: 14});
        assert(result, 'Result not found');
        assert.equal(result.type, 'ArrayExpression');
    });

});
