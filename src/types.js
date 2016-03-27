/* @flow */
import type Position from 'babel-generator/lib/position';

type Location = {
  start: Position;
  end: Position;
};
type NodeInfo = {
  name: ?Object;
  id: ?Object,
  type: ?Object;
}

export type {
  Location,
  Position,
  NodeInfo,
};
