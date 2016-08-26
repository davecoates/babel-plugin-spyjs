import getWatchTargets from '../src/getWatchTargets';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.join(__dirname, 'fixtures', 'watchTargetsSource.js'));

describe('getWatchTargets', () => {
    // Column is 0 based, line is 1 based
    it('should find target at line and column', () => {
        let result = getWatchTargets(source, {line: 4, column: 24});
        assert(result, 'Result not found');
        assert.equal(result.type, 'StringLiteral');
        assert.equal(result.node.value, 'hah!');

        result = getWatchTargets(source, {line: 4, column: 20});
        assert(result, 'Result not found');
        assert.equal(result.type, 'CallExpression');

        result = getWatchTargets(source, {line: 4, column: 14});
        assert(result, 'Result not found');
        assert.equal(result.type, 'Identifier');
        assert.equal(result.node.name, 'console');


        result = getWatchTargets(source, {line: 3, column: 24});
        assert(result, 'Result not found');
        assert.equal(result.type, 'NumericLiteral');
        assert.equal(result.node.value, 1);

        result = getWatchTargets(source, {line: 3, column: 22});
        assert(result, 'Result not found');
        assert.equal(result.type, 'ArrayExpression');

        result = getWatchTargets(source, {line: 10, column: 5});
        assert(result, 'Result not found');
        assert.equal(result.type, 'ObjectExpression');

        result = getWatchTargets(source, {line: 8, column: 8});
        assert(result, 'Result not found');
        assert.equal(result.type, 'StringLiteral');

        result = getWatchTargets(source, {line: 11, column: 10});
        assert(result, 'Result not found');
        assert.equal(result.type, 'StringLiteral');
    });

});
