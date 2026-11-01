/** Plain immutable layout owner. No renderer state or resource handles are serialized. */
export type Edge = "left" | "right" | "top" | "bottom";
export type Tab = {
    id: string;
    title: string;
    pinned?: boolean;
};
export type Group = {
    kind: "group";
    id: string;
    tabs: Tab[];
    selected: string | null;
    locked?: boolean;
};
export type Split = {
    kind: "split";
    id: string;
    axis: "horizontal" | "vertical";
    ratio: number;
    first: Node;
    second: Node;
};
export type Node = Group | Split;
export type Layout = {
    version: 1;
    root: Node;
};
export type Drop = {
    group: string;
    index?: number;
    edge?: Edge;
    groupId?: string;
    splitId?: string;
};
export declare function groups(node: Node): Group[];
export declare function select(layout: Layout, tabId: string): Layout;
export declare function close(layout: Layout, tabId: string): Layout;
export declare function move(layout: Layout, tabId: string, drop: Drop): Layout;
export declare function resize(layout: Layout, splitId: string, ratio: number): Layout;
/** Validate once when importing untrusted persistence. Throws instead of silently losing panes. */
export declare function parseLayout(value: unknown): Layout;
