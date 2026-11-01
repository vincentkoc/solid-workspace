# Solid Workspace

A small **Solid 2** workspace: serializable split/tabset trees, tab reorder and
cross-group edge drops, keyboard tab navigation and move commands, resize
separators, and stable mounted content.

## Status and upstream

Experimental foundation targeting the exact **2.0.0-rc.18** runtime used by
OpenClaw. Not a Solid 1 component. Not published to npm. No compatibility claim
for other release candidates. Intended ecosystem home: this standalone package,
not Solid's reactive core and not an OpenClaw plugin that competes with core layout.
OpenClaw owns pane/session state and its plugin slots; the library owns only
layout operations and rendering. Integration into OpenClaw is separate work.

The behavioral reference is Brian Vaughn's MIT-licensed
[react-resizable-panels Workspace](https://github.com/bvaughn/react-resizable-panels/pull/780),
inspected at `efbe3125262caf5fdbc88f7e0c6438e7065bb392`. This is an independent
Solid implementation, not copied React source. Credit to Brian Vaughn and
contributors for the workspace interaction concept.

## Development

```
npm ci
npm run check
npm test
npm run build
npm run dev
```

The root demo includes a DOM-owned textarea, counter, and independent iframe.
Use `node test/browser.mjs` against the demo server for real Chromium checks.

## Consumption

Use a reviewed Git commit, not an invented registry version. `npm run build`
produces ESM plus declarations and CSS; `npm pack` creates a conventional package
archive. The checked-in distribution (generated and verified from source) permits
commit-pinned GitHub installation without running an install lifecycle script.
Import `@vincentkoc/solid-workspace` and `@vincentkoc/solid-workspace/style.css`.
There is no npm release or install-time download script.

```tsx
import { Workspace, type Layout } from '@vincentkoc/solid-workspace';
import '@vincentkoc/solid-workspace/style.css';
// Own layout in the application. Validate persisted input with parseLayout.
<Workspace layout={layout()} onChange={setLayout}
  renderTab={(tab, presented) => <ApplicationPane id={tab().id} active={presented()} />} />
```

`renderTab` runs once per tab lifetime, under that tab's retained Solid owner.
Its tab descriptor and presentation arguments are accessors. No resource handles,
JSX, credentials, or application state belong in the serialized layout. The
application owns resource creation, closing permissions, and persistence.

## Application-owned content

For resource hosts that already belong to an application, omit `renderTab` and
consume `onGeometry` to position those existing hosts without changing their DOM
parent. Group rectangles include the fixed 36px tab header; subtract that header
from the content rectangle. Route `onCloseTab` through the application's own
close/confirmation contract. This controlled mode intentionally does not retire
resources itself; the application removes the tab after it accepts the close.

## Contracts

- `Layout.version` is 1; the root is a binary split or group. Split ratios are
  clamped 10–90%. IDs are stable and unique within node/tab namespaces.
- `parseLayout` validates imported data; model operations trust validated input.
- Pure synchronous `select`, `move`, `close`, and `resize` return a new layout.
  Invalid or forbidden moves return the same object. Empty branches collapse;
  closing the final tab leaves an empty root group. Moves preserve tab descriptors.
- `move` insertion indices refer to slots **before** removal. Edge moves require
  two fresh node IDs supplied by the caller. Pinned tabs form a prefix, cannot
  move or close; locked groups cannot receive, move, or close tabs. `canDrop`
  extends view-level application policy; applications calling model operations
  directly must apply their own policy.
- Mouse/HTML drag: reorder on a tab, append on the header, split at the outer 20%
  of content; center drops append. Native HTML drag is not a touch drag contract.
- Keyboard: Left/Right/Home/End select tabs; Delete closes unpinned tabs. The
  separate Move button opens explicit center/edge destinations (Escape cancels).
  Separators use physical Left/Right or Up/Down; Home/End reach bounds.
- Content hosts stay mounted at the same parent and sibling order when moving,
  splitting, selecting, or restoring layouts with the same IDs. Geometry changes
  absolutely positioned hosts rather than moving DOM nodes. Only closing a tab
  retires its Solid owner. Inactive content is hidden/inert; expensive application
  work should respect the supplied `presented` accessor.
- This does not promise to preserve cross-window documents, native browser views,
  or application resources disposed by their own hidden/presentation lifecycle.
  Iframe retention must be tested in each supported browser. Stable DOM avoids
  reparent reloads but does not override application/resource behavior.
- Current renderer uses physical coordinates (including under RTL), fixed 36px
  header height and 6px separators. Tiny containers can overflow tab labels;
  content is clamped at zero. No SSR or cross-window docking claim.
