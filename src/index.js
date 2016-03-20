import { readFileSync } from 'fs';

const runtimeScript = readFileSync(__dirname + '/runtime.js', 'utf-8');

export default function({ types: t, template }) {

    let injectedRuntime = false;

    // Construct wrapped versions of types that flag anything created with them
    // as already visited. I have no idea if this is a good idea! Needed to stop
    // nodes created as part of wrapping other nodes from being traversed.
    const types = {};
    for (const key of ['numericLiteral', 'stringLiteral', 'objectProperty', 'objectExpression', 'identifier']) {
        types[key] = target => IGNORE(t[key](target));
    }

    const VISITED_KEY = 'watcher-spies-' + Date.now();

    function IGNORE(target) {
        target[VISITED_KEY] = true;
        return target;
    }

    // This is passed to the API function for each wrapped node
    function buildLocationObject(filename, loc) {
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
    function toObjectExpression(object) {
        const properties = Object.keys(object).map(key => {
            return t.objectProperty(types.identifier(key), object[key]);
        });

        return types.objectExpression(properties);
    }

    const componentVisitor = {

        BinaryExpression(path) {
            if (path.node[VISITED_KEY]) {
                return;
            }
            path.node[VISITED_KEY] = true;

            path.replaceWith(
                this.wrapNode(path.node)
            );
        },

        Identifier(path) {
            if (path.node[VISITED_KEY]) {
                return;
            }
            // TODO: Work out what should actually do here
            if (path.parent.type !== 'BinaryExpression') {
                // We can't wrap these!
                // const a = 1 + 2;
                // this doesn't make sense:
                // const $d(a) = 1 + 2;
                return;
            }
            path.node[VISITED_KEY] = true;
            path.replaceWith(
                this.wrapNode(path.node)
            );
        },

    };

    class SpyBuilder {
        constructor(file, options) {
            this.file = file;
            this.filename = file.opts.filename;
            this.program = file.path;
            this.apiFunctionId = types.identifier('$d');
        }

        build() {
            const wrapNode = node => {
                const info = buildLocationObject(this.filename, node.loc);
                info.type = types.stringLiteral(node.type);
                if (node.name) {
                    info.name = types.stringLiteral(node.name);
                }
                return t.callExpression(
                    this.apiFunctionId,
                    [node, toObjectExpression(info)]
                );
            }

            this.file.path.traverse(componentVisitor, {
                wrapNode,
            });
        }

    }

    return {
        visitor: {
            Program(path, { file, opts: {
                injectRuntime = true,
                globalApiFunctionName = '__spyCallback',
            } }) {
                if (injectRuntime && !injectedRuntime) {
                    injectedRuntime = true;
                    const injection = t.identifier(runtimeScript.replace(
                        '__GLOBAL_FUNC_NAME__', globalApiFunctionName));
                    path.node.body.unshift(t.expressionStatement(injection));
                }
                const builder = new SpyBuilder(file, { injectRuntime, globalApiFunctionName });
                builder.build();
            }
        }
    };
}
