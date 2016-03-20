import path from 'path';
import fs from 'fs';
import assert from 'assert';
import { transformFileSync } from 'babel-core';
import plugin from '../src';

function trim(str) {
    return str.replace(/^\s+|\s+$/, '');
}

const babelOptions = {
    extends: '../.babelrc',
    babelrc: false,
};

const isDir = path => fs.lstatSync(path).isDirectory()

describe('finds things to spy on', () => {
    const fixturesDir = path.join(__dirname, 'fixtures');
    fs.readdirSync(fixturesDir).map((caseName) => {
        if (!isDir(path.join(fixturesDir, caseName))) return;
        it(`should ${caseName.split('-').join(' ')}`, () => {
            const fixtureDir = path.join(fixturesDir, caseName);
            let actualPath = path.join(fixtureDir, 'actual.js');
            const actual = transformFileSync(actualPath, babelOptions).code;

            if (path.sep === '\\') {
                // Specific case of windows, transformFileSync return code with '/'
                actualPath = actualPath.replace(/\\/g, '/');
            }

            const expected = fs.readFileSync(
                path.join(fixtureDir, 'expected.js')
            ).toString().replace(/%FIXTURE_PATH%/g, actualPath);

            assert.equal(trim(actual), trim(expected));
        });
    });
});
