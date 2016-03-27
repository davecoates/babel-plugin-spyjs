/* @flow */
import { transform } from 'babel-core';

type CodeLocation = {
  line: number;
  column: number;
};

/**
 * Parse some code and find node at location specified by target
 * @param {String} code
 * @param {Object} target
 * @param {Number} target.line
 * @param {Number} target.column
 */
export default function getWatchTargets(code:string, target:CodeLocation, babelOptions:?Object) : Object {
    const result = transform(code, {
        ...babelOptions,
        plugins: [
            [`${__dirname}/findTargetNode.js`, { target } ],
        ],
    });
    return result.metadata.watchMatchPath;
}
