/* @flow */
import type { Location, NodeInfo, Position } from './types';

function containsPoint({start, end} : Location, {line, column} : Position) : bool {
    if (start.line === end.line && start.line === line) {
        return (start.column <= column && end.column >= column);
    }
    return start.line <= line && end.line >= line;
}

function locationSize({start, end} : Location) : {lines: number, columns: number}{
    return {
        lines: end.line - start.line,
        columns: end.column - start.column,
    };
}

function narrowestNode(a, b) {
    if (!a) return b;
    if (!b) return a;
    const aSize = locationSize(a.node.loc);
    const bSize = locationSize(b.node.loc);
    if (aSize.lines === bSize.lines) {
        return aSize.columns < bSize.columns ? a : b;
    }
    return aSize.lines < bSize.lines ? a : b;
}

export default function findTargetNode({ types: t} : {types: Object} ) : Object {
    const allTypes = Object.keys(t.FLIPPED_ALIAS_KEYS).join('|');
    let match;
    return {
        visitor: {
            Program(path, { file, opts: { target } }) {
                this.target = target;
                let deepest;
                file.path.traverse({
                    [allTypes](path) {
                        if (containsPoint(path.node.loc, target)) {
                            deepest = narrowestNode(path, deepest);
                        }
                    }
                });
                file.metadata.watchMatchPath = deepest;
            }
        }
    };
}
