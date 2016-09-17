/* @flow */
import touch from 'touch';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import initialiseServer from './server';
import messageTypes from './messageTypes';
import { containsPoint } from './findTargetnode';
import type { Location, NodeInfo, Position } from './types';

function replace(str:string, valueMap:{[key:string]: string}) {
    for (const key in valueMap) {
        str = str.replace(new RegExp(key, 'g'), valueMap[key]);
    }
    return str;
}

const runtimeScript = readFileSync(__dirname + '/../lib/runtime.js', {encoding: 'utf-8'});

export default function({ types: t } : { types: Object }) : Object {

    let injectedRuntime = false;
    let wsServer;

    // Construct wrapped versions of types that flag anything created with them
    // as already visited. I have no idea if this is a good idea! Needed to stop
    // nodes created as part of wrapping other nodes from being traversed.
    const types = {};
    for (const key of ['numericLiteral', 'stringLiteral', 'objectProperty', 'objectExpression', 'identifier']) {
        types[key] = target => IGNORE(t[key](target));
    }

    const VISITED_KEY = 'spyjs-spies-' + Date.now();

    function IGNORE(target) {
        target[VISITED_KEY] = true;
        return target;
    }

    // This is passed to the API function for each wrapped node
    function buildLocationObject(filename:string, loc:Location) : {filename: Object, loc: Object} {
        return {
            filename: types.stringLiteral(filename),
            loc: toObjectExpression({
                start: toObjectExpression({
                    line: types.numericLiteral(loc.start.line),
                    column: types.numericLiteral(loc.start.column + 1),
                }),
                end: toObjectExpression({
                    line: types.numericLiteral(loc.end.line),
                    column: types.numericLiteral(loc.end.column + 1),
                })
            })
        };
    }

    // `{ name: foo }` => Node { type: "ObjectExpression", properties: [...] }
    function toObjectExpression(object: Object) {
        const properties = Object.keys(object).map(key => {
            if (object[key] == null) {
              return null;
            }
            return t.objectProperty(types.identifier(key), object[key]);
        });

        return types.objectExpression(properties.filter(prop => !!prop));
    }

    function SimpleWrapNode(path) {
          if (!this.shouldVisit(path)) {
        return;
      }
      path.node[VISITED_KEY] = true;
      path.replaceWith(
        this.wrapNode(path.node)
      );
    }

    function FunctionWrapNode(path) {
        if (!this.shouldVisit(path)) {
        return;
      }
      path.node[VISITED_KEY] = true;
      const wrapParam = param => {
        const node = param.type == 'AssignmentPattern' ? param.left : param;
        // TODO: Handle rest operator and destructuring
        return this.wrapNode(node);
      };
      path.node.body.body = [
        ...path.node.params.map(wrapParam), ...path.node.body.body];
    }

    const allTypes = Object.keys(t.FLIPPED_ALIAS_KEYS);
    const visitTypes = [
                'Identifier', 'Literal', 'StringLiteral',
                'NumericLiteral', 'NewExpression', 'BinaryExpression',
                'CallExpression', 'ArrayExpression', 'ArrowFunctionExpression',
                'ObjectExpression',
            ];

    const componentVisitor = {
        [visitTypes.join('|')](path) {
            if (!this.shouldVisit(path.node)) {
                return false;
            }
            if (['ImportDefaultSpecifier', 'ImportDeclaration', 'ImportSpecifier'].indexOf(path.parent.type) !== -1) {
                return false;
            }
            if (path.type === 'Identifier') {
                // We don't want to attempt to watch 'log' (property)
                // console.log('test')
                // ... or myVar (id)
                //   let myvar = '2';
                const parentType = path.parent.type;
                if (['value', 'object'].indexOf(path.key) === -1 &&
                    ['TemplateLiteral', 'BinaryExpression', 'ReturnStatement'].indexOf(parentType) === -1) {
                    return false;
                }
                // this will accept someProperty (key)
                //   { someProperty: 'test' }
                // but we extract value in postprocessing below
            }
            path.node[VISITED_KEY] = true;
            if (!path.node.loc) {
                return false;
            }
            path.replaceWith(this.wrapNode(path.node));
        }
    };

    class SpyBuilder {
        filename: string;
        apiFunctionId: {};
        options: {};
        program: {};
        file: {
            path: Object;
        };

        constructor(file, isWatchingNode, options) {
            this.file = file;
            this.filename = file.opts.filename;
            this.program = file.path;
            this.apiFunctionId = types.identifier(options.globalApiFunctionName);
            this.options = options;
            this.isWatchingNode = isWatchingNode;
        }

        build() {
            let nodeId = 0;
            const wrapNode = node => {
                const info : NodeInfo = {
                    ...buildLocationObject(this.filename, node.loc),
                    type: types.stringLiteral(node.type),
                    name: null,
                    id: null,
                };
                if (!this.options.supressId) {
                    info.id = types.numericLiteral(nodeId++);
                }
                if (node.name) {
                    info.name = types.stringLiteral(node.name);
                }
                return t.callExpression(
                    this.apiFunctionId,
                    [node, toObjectExpression(info)]
                );
            };

            const shouldVisit = node => {
                if (!node || node[VISITED_KEY] || (node.callee && node.callee[VISITED_KEY])) {
                    return false;
                }
                return this.isWatchingNode(node);
            };

            this.file.path.traverse(componentVisitor, {
                wrapNode,
                shouldVisit
            });
        }

    }

    const watches = {};
    return {
        visitor: {
            Program(path, { file, opts: {
                injectRuntime = true,
                globalApiFunctionName = '__spyCallback',
                serverPort = 3300,
                // Supress 'id' in info object passed to api function. Primarily for tests.
                supressId = false,
            } }) {
                    const messageTypeHandlers = {
                        [messageTypes.WATCH_TARGET](payload) {
                            const { filename, target } = payload;
                            watches[filename] = watches[filename] || [];
                            watches[filename].push(target);
                            touch(filename);
                        },
                        [messageTypes.CLEAR_FILE_WATCHES](payload) {
                            const { filename } = payload;
                            watches[filename] = [];
                            console.log('clear', filename);
                            touch(filename);
                        },
                    };
                    function isWatchingNode(node) {
                        const { filename } = file.opts;
                        const { loc } = node;
                        if (!loc) {
                            return false;
                        }
                        if (!watches[filename]) return false;

                        for (const watch of watches[filename]) {
                            if (containsPoint(watch, loc.start)) {
                                return true;
                            }
                        }
                        return false;
                    }
                    if (!wsServer) {
                        wsServer = initialiseServer(serverPort, messageTypeHandlers);
                    }
                    if (injectRuntime) {
                        injectedRuntime = true;
                        const injection = t.identifier(replace(runtimeScript, {
                            __GLOBAL_FUNC_NAME__: globalApiFunctionName,
                            __WS_ADDRESS__: '127.0.0.1',
                            __WS_PORT__: String(serverPort),
                        }));
                        path.node.body.unshift(t.expressionStatement(injection));
                    }
                    const builder = new SpyBuilder(file, isWatchingNode, {
                        injectRuntime, globalApiFunctionName, supressId,
                    });
                    builder.build();
                }
        }
    };
}
