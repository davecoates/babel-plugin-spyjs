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
    const filter = path => {
        if (path.type === 'Identifier') {
            // We don't want to attempt to watch 'log' (property)
            // console.log('test')
            // ... or myVar (id)
            //   let myvar = '2';
            if (['key', 'property', 'id'].indexOf(path.key) !== -1) {
                return false;
            }
            // this will accept someProperty (key)
            //   { someProperty: 'test' }
            // but we extract value in postprocessing below
        }
        return true;
    };
    const types = [
        'Identifier', 'Literal', 'ExpressionStatement', 'StringLiteral',
        'CallExpression', 'ArrayExpression',
        'ObjectExpression',
        // We accept this but take it's init value in post processing
        'VariableDeclarator',
        // We accept this but then take it's value in post processing below
        'ObjectProperty',
    ];
    const result = transform(code, {
        ...babelOptions,
        plugins: [
            [`${__dirname}/findTargetNode.js`, { types, target, filter } ],
        ],
    });
    const { watchMatchPath } = result.metadata;

    if (watchMatchPath.type === 'VariableDeclarator') {
        // For a VariableDeclarator we want to watch the value so for,
        //    const a = 'test';
        // we care about 'test';
        return watchMatchPath.node.init;
    }
    if (watchMatchPath.type === 'ObjectProperty') {
        // For an ObjectProperty take the value so for,
        //   { myProp: 'test' }
        // we care about 'test'
        return watchMatchPath.node.value;
    }
    return watchMatchPath;
}
