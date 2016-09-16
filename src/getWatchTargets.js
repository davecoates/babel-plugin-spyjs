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
    const getWatchableTarget = path => {
        const types = [
            'Identifier', 'Literal', 'ExpressionStatement', 'StringLiteral',
            'NumericLiteral', 'VariableDeclaration', 'BlockStatement', 'ClassMethod',
            'ClassDeclaration', 'NewExpression', 'BinaryExpression',
            'CallExpression', 'ArrayExpression', 'ArrowFunctionExpression',
            'FunctionDeclaration', 'ObjectExpression', 'ObjectProperty',
        ];

        if (types.indexOf(path.type) === -1) {
            return false;
        }
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
        if (path.type === 'VariableDeclaration') {
            // For a VariableDeclarator we want to watch the value so for,
            //    const a = 'test';
            // we care about 'test';
            // But can also have,
            //    const a = 1, b = 2;
            // So there's 2 valid targets!
            const declarations = path.node.declarations.map(node => node.init);
            return [path.node, ...declarations];
        }
        if (path.type === 'ObjectProperty') {
            // For an ObjectProperty take the value so for,
            //   { myProp: 'test' }
            // we care about 'test'
            return [path.node, path.node.value];
        }
        return path.node;
    };
    const result = transform(code, {
        ...babelOptions,
        plugins: [
            [`${__dirname}/findTargetNode.js`, { target, getWatchableTarget } ],
        ],
    });
    const { matches, watchMatchPath, range } = result.metadata;

//    console.log(matches.map(path => path.loggable))
    return { watchMatchPath, matches, range };
}
