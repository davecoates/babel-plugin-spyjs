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
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'StringLiteral');
        assert.equal(result.watchMatchPath.loggableTarget[0].value, 'hah!');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 4, column: 24 },
            end: { line: 4, column: 29 },
        });

        result = getWatchTargets(source, {line: 4, column: 20});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'CallExpression');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 4, column: 12 },
            end: { line: 4, column: 30 },
        });

        result = getWatchTargets(source, {line: 4, column: 14});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'Identifier');
        assert.equal(result.watchMatchPath.loggableTarget[0].name, 'console');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 4, column: 12 },
            end: { line: 4, column: 18 },
        });


        result = getWatchTargets(source, {line: 3, column: 24});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'NumericLiteral');
        assert.equal(result.watchMatchPath.loggableTarget[0].value, 1);
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 3, column: 23 },
            end: { line: 3, column: 23 },
        });

        result = getWatchTargets(source, {line: 3, column: 22});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'ArrayExpression');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 3, column: 22 },
            end: { line: 3, column: 28 },
        });

        result = getWatchTargets(source, {line: 10, column: 5});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'ObjectExpression');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 10, column: 14 },
            end: { line: 16, column: 4 },
        });

        result = getWatchTargets(source, {line: 8, column: 11});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'VariableDeclaration');
        assert.equal(result.watchMatchPath.loggableTarget[1].type, 'StringLiteral');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 8, column: 4 },
            end: { line: 8, column: 20 },
        });

        result = getWatchTargets(source, {line: 11, column: 10});
        assert(result, 'Result not found');
        assert.equal(result.watchMatchPath.loggableTarget[0].type, 'ObjectProperty');
        assert.equal(result.watchMatchPath.loggableTarget[1].type, 'StringLiteral');
        assert.deepEqual(result.watchMatchPath.range, {
            start: { line: 11, column: 8 },
            end: { line: 11, column: 19 },
        });
    });

});
