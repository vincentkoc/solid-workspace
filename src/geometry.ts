import type { Node, Group, Split } from "./model.js";
export type Rect = { x: number; y: number; width: number; height: number };
export type Geometry = {
  groups: (Rect & { node: Group })[];
  splits: (Rect & { node: Split; parent: Rect })[];
};
export function geometry(root: Node, width: number, height: number): Geometry {
  const result: Geometry = { groups: [], splits: [] };
  function walk(node: Node, r: Rect) {
    if (node.kind === "group") {
      result.groups.push({ ...r, node });
      return;
    }
    const horizontal = node.axis === "horizontal",
      length = horizontal ? r.width : r.height;
    const available = Math.max(0, length - 6),
      first = available * node.ratio;
    const a = { ...r },
      b = { ...r },
      divider = { ...r };
    if (horizontal) {
      a.width = first;
      b.x += first + 6;
      b.width = available - first;
      divider.x += first;
      divider.width = 6;
    } else {
      a.height = first;
      b.y += first + 6;
      b.height = available - first;
      divider.y += first;
      divider.height = 6;
    }
    result.splits.push({ ...divider, node, parent: r });
    walk(node.first, a);
    walk(node.second, b);
  }
  walk(root, { x: 0, y: 0, width: Math.max(0, width), height: Math.max(0, height) });
  return result;
}
