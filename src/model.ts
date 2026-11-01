/** Plain immutable layout owner. No renderer state or resource handles are serialized. */
export type Edge = 'left' | 'right' | 'top' | 'bottom';
export type Tab = { id: string; title: string; pinned?: boolean };
export type Group = { kind: 'group'; id: string; tabs: Tab[]; selected: string | null; locked?: boolean };
export type Split = { kind: 'split'; id: string; axis: 'horizontal' | 'vertical'; ratio: number; first: Node; second: Node };
export type Node = Group | Split;
export type Layout = { version: 1; root: Node };
export type Drop = { group: string; index?: number; edge?: Edge; groupId?: string; splitId?: string };
export function groups(node: Node): Group[] { return node.kind === 'group' ? [node] : [...groups(node.first), ...groups(node.second)]; }
function map(node: Node, fn: (node: Node) => Node): Node {
  return fn(node.kind === 'group' ? node : {...node, first: map(node.first, fn), second: map(node.second, fn)});
}
function compact(node: Node): Node {
  if (node.kind === 'group') return node;
  const first = compact(node.first), second = compact(node.second);
  if (first.kind === 'group' && !first.tabs.length) return second;
  if (second.kind === 'group' && !second.tabs.length) return first;
  return {...node, first, second};
}
export function select(layout: Layout, tabId: string): Layout {
  return {...layout, root: map(layout.root, n => n.kind === 'group' && n.tabs.some(t => t.id === tabId) ? {...n, selected: tabId} : n)};
}
export function close(layout: Layout, tabId: string): Layout {
  const source = groups(layout.root).find(g => g.tabs.some(t => t.id === tabId));
  if (!source || source.locked || source.tabs.find(t => t.id === tabId)?.pinned) return layout;
  return {...layout, root: compact(map(layout.root, n => {
    if (n.id !== source.id || n.kind !== 'group') return n;
    const index = n.tabs.findIndex(t => t.id === tabId), tabs = n.tabs.filter(t => t.id !== tabId);
    return {...n, tabs, selected: n.selected === tabId ? tabs[Math.min(index, tabs.length - 1)]?.id ?? null : n.selected};
  }))};
}
export function move(layout: Layout, tabId: string, drop: Drop): Layout {
  const all = groups(layout.root), source = all.find(g => g.tabs.some(t => t.id === tabId)), target = all.find(g => g.id === drop.group);
  const tab = source?.tabs.find(t => t.id === tabId);
  if (!source || !target || !tab || source.locked || target.locked || tab.pinned) return layout;
  if (drop.edge && source.id === target.id && source.tabs.length === 1) return layout;
  const ids = new Set<string>(); map(layout.root, n => { ids.add(n.id); return n; });
  if (drop.edge && (!drop.groupId || !drop.splitId || drop.groupId === drop.splitId || ids.has(drop.groupId) || ids.has(drop.splitId))) return layout;
  if (drop.index !== undefined && (!Number.isInteger(drop.index) || drop.index < 0 || drop.index > target.tabs.length)) return layout;
  // Indices describe slots in the original target list, before removal.
  let index = drop.index ?? target.tabs.length;
  if (source.id === target.id && source.tabs.findIndex(t => t.id === tabId) < index) index--;
  const pinnedCount = target.tabs.filter(t => t.pinned).length;
  if (!drop.edge && index < pinnedCount) return layout;
  let root = map(layout.root, n => {
    if (n.kind !== 'group' || n.id !== source.id) return n;
    const tabs = n.tabs.filter(t => t.id !== tabId);
    return {...n, tabs, selected: n.selected === tabId ? tabs[0]?.id ?? null : n.selected};
  });
  root = map(root, n => {
    if (n.kind !== 'group' || n.id !== target.id) return n;
    if (!drop.edge) { const tabs = [...n.tabs]; tabs.splice(index, 0, tab); return {...n, tabs, selected: tabId}; }
    const fresh: Group = {kind: 'group', id: drop.groupId!, tabs: [tab], selected: tabId};
    const before = drop.edge === 'left' || drop.edge === 'top';
    return {kind:'split', id:drop.splitId!, axis:drop.edge === 'left' || drop.edge === 'right' ? 'horizontal' : 'vertical', ratio:0.5, first:before ? fresh : n, second:before ? n : fresh};
  });
  return {...layout, root: compact(root)};
}
export function resize(layout: Layout, splitId: string, ratio: number): Layout {
  if (!Number.isFinite(ratio)) return layout;
  return {...layout, root: map(layout.root, n => n.id === splitId && n.kind === 'split' ? {...n, ratio: Math.min(.9, Math.max(.1, ratio))} : n)};
}
/** Validate once when importing untrusted persistence. Throws instead of silently losing panes. */
export function parseLayout(value: unknown): Layout {
  const nodeIds = new Set<string>(), tabIds = new Set<string>();
  function object(x: unknown): Record<string, unknown> { if (!x || typeof x !== 'object' || Array.isArray(x)) throw Error('Invalid layout object'); return x as Record<string, unknown>; }
  function id(x: unknown, seen: Set<string>): string { if(typeof x !== 'string' || !x || seen.has(x)) throw Error('Invalid or duplicate id'); seen.add(x); return x; }
  function parse(x: unknown, depth: number): Node {
    if (depth > 32) throw Error('Layout too deep');
    const n = object(x), nodeId = id(n.id, nodeIds);
    if (n.kind === 'split') {
      if ((n.axis !== 'horizontal' && n.axis !== 'vertical') || typeof n.ratio !== 'number' || !Number.isFinite(n.ratio) || n.ratio < .1 || n.ratio > .9) throw Error('Invalid split');
      return {kind:'split',id:nodeId,axis:n.axis,ratio:n.ratio,first:parse(n.first,depth+1),second:parse(n.second,depth+1)};
    }
    if (n.kind !== 'group' || !Array.isArray(n.tabs) || (n.locked !== undefined && typeof n.locked !== 'boolean')) throw Error('Invalid group');
    const tabs = n.tabs.map(t => { const tab = object(t); if(typeof tab.title !== 'string' || (tab.pinned !== undefined && typeof tab.pinned !== 'boolean')) throw Error('Invalid tab'); return {id:id(tab.id,tabIds),title:tab.title,...(tab.pinned === undefined ? {} : {pinned:tab.pinned})}; });
    if ((tabs.length ? !tabs.some(t => t.id === n.selected) : n.selected !== null)) throw Error('Invalid selection');
    let unpinned = false; for (const t of tabs) { if(t.pinned && unpinned) throw Error('Pinned tabs must precede other tabs'); if(!t.pinned) unpinned=true; }
    return {kind:'group',id:nodeId,tabs,selected:n.selected as string | null,...(n.locked === undefined ? {} : {locked:n.locked})};
  }
  const layout = object(value); if(layout.version !== 1) throw Error('Unsupported layout version');
  return {version:1,root:parse(layout.root,0)};
}
