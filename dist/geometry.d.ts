import type { Node, Group, Split } from './model';
export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type Geometry = {
    groups: (Rect & {
        node: Group;
    })[];
    splits: (Rect & {
        node: Split;
        parent: Rect;
    })[];
};
export declare function geometry(root: Node, width: number, height: number): Geometry;
