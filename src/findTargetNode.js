/* @flow */
import type { Location, NodeInfo, Position } from './types';

export function containsPoint({start, end} : Location, {line, column} : Position) : bool {
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
    const aSize = locationSize(a.path.node.loc);
    const bSize = locationSize(b.path.node.loc);
    if (aSize.lines === bSize.lines) {
        return aSize.columns < bSize.columns ? a : b;
    }
    return aSize.lines < bSize.lines ? a : b;
}

function expandRangeToInclude(existingRange, range) {
    return {
        start: {
            line: Math.min(existingRange.start.line, range.start.line),
            column: Math.min(existingRange.start.column, range.start.column),
        },
        end: {
            line: Math.min(existingRange.end.line, range.end.line),
            column: Math.min(existingRange.end.column, range.end.column),
        },
    };
}

export default function findTargetNode({ types: t} : {types: Object} ) : Object {
    const allTypes = Object.keys(t.FLIPPED_ALIAS_KEYS);
    let match;
    return {
        visitor: {
            Program(path, { file, opts: { types = allTypes, target, getWatchableTarget = i => i.node } }) {
                this.target = target;
                let deepest;
                const matches = []
                file.path.traverse({
                    [types.join('|')](path) {
                        if (containsPoint(path.node.loc, target)) {
                            let loggableTarget = getWatchableTarget(path);
                            if (loggableTarget && !Array.isArray(loggableTarget )) {
                                loggableTarget = [loggableTarget];
                            }
                            const wrappedPath = {
                                path,
                                loggableTarget,
                                range: loggableTarget && loggableTarget.reduce(
                                    (range, target) => expandRangeToInclude(range, target.loc),
                                    loggableTarget[0].loc
                                ),
                            };
                            if (wrappedPath.loggableTarget) {
                                deepest = narrowestNode(wrappedPath, deepest);
                            }
                            const index = matches.indexOf(deepest);
                            if (index === -1) {
                                matches.push(wrappedPath);
                            } else {
                                matches.splice(index, 0, wrappedPath);
                            }
                        }
                    }
                });
                file.metadata.watchMatchPath = deepest;
                file.metadata.matches = matches;
            }
        }
    };
}
