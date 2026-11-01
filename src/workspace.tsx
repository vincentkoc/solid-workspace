import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onSettled,
  type Element,
} from "solid-js";
import {
  close,
  groups,
  move,
  resize,
  select,
  type Drop,
  type Edge,
  type Group,
  type Layout,
  type Tab,
} from "./model.js";
import { geometry, type Rect, type Geometry } from "./geometry.js";
export type WorkspaceProps = {
  layout: Layout;
  onChange: (layout: Layout) => void;
  renderTab?: (tab: () => Tab, presented: () => boolean) => Element;
  /** Headless content layout: retain externally-owned hosts and position them from these rectangles. */
  onGeometry?: (geometry: Geometry) => void;
  onCloseTab?: (id: string) => void;
  label?: string;
  canDrop?: (tab: Tab, destination: Drop) => boolean;
};
const position = (r: Rect) => ({
  left: `${r.x}px`,
  top: `${r.y}px`,
  width: `${r.width}px`,
  height: `${r.height}px`,
});
/** Content hosts never change parent or order when the layout changes. */
export function Workspace(props: WorkspaceProps) {
  let host!: HTMLDivElement;
  let dragging: string | null = null;
  const [isDragging, setDragging] = createSignal(false);
  let pointerCleanup: (() => void) | undefined;
  const [size, setSize] = createSignal({ width: 0, height: 0 });
  const [announcement, announce] = createSignal("");
  const [moving, setMoving] = createSignal<string | null>(null);
  const boxes = createMemo(() => geometry(props.layout.root, size().width, size().height));
  // Sort by stable ID: moving a tab does not reorder its DOM siblings either.
  const tabs = createMemo(() =>
    groups(props.layout.root)
      .flatMap((g) => g.tabs)
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
  createEffect(boxes, (value) => props.onGeometry?.(value));
  const tabBoxes = createMemo(
    () => new Map(boxes().groups.flatMap((g) => g.node.tabs.map((t) => [t.id, g] as const))),
  );
  const dismiss = (id: string) => {
    if (props.onCloseTab) {
      props.onCloseTab(id);
      return;
    }
    const next = close(props.layout, id);
    const survivor = groups(next.root).find((g) => g.selected)?.selected;
    publish(next, "Tab closed", survivor ?? undefined);
  };
  const focusTab = (id: string) =>
    onSettled(() => {
      host.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(id)}"]`)?.focus();
    });
  const publish = (next: Layout, message: string, focus?: string) => {
    if (next === props.layout) return;
    props.onChange(next);
    announce(message);
    if (focus) focusTab(focus);
  };
  function relocate(id: string, destination: Drop) {
    const tab = tabs().find((t) => t.id === id);
    if (!tab || props.canDrop?.(tab, destination) === false) return;
    const drop = destination.edge
      ? { ...destination, groupId: crypto.randomUUID(), splitId: crypto.randomUUID() }
      : destination;
    publish(move(props.layout, id, drop), `${tab.title} moved`, id);
    setMoving(null);
  }
  onSettled(() => {
    const observer = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ width: r.width, height: r.height });
    });
    observer.observe(host);
    return () => observer.disconnect();
  });
  onCleanup(() => pointerCleanup?.());
  function startResize(event: PointerEvent, id: string, axis: string, parent: Rect) {
    if (event.button !== 0) return;
    event.preventDefault();
    pointerCleanup?.();
    const bounds = host.getBoundingClientRect();
    const update = (e: PointerEvent) => {
      const offset =
        axis === "horizontal"
          ? e.clientX - bounds.left - parent.x
          : e.clientY - bounds.top - parent.y;
      const length = (axis === "horizontal" ? parent.width : parent.height) - 6;
      props.onChange(resize(props.layout, id, offset / Math.max(1, length)));
    };
    const end = () => {
      window.removeEventListener("pointermove", update);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      pointerCleanup = undefined;
    };
    window.addEventListener("pointermove", update);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    pointerCleanup = end;
  }
  function TabButton(p: { tab: Tab; group: Group }) {
    return (
      <span class="sw-tab-wrap">
        <button
          role="tab"
          data-tab-id={p.tab.id}
          aria-selected={p.group.selected === p.tab.id ? "true" : "false"}
          tabindex={p.group.selected === p.tab.id ? 0 : -1}
          draggable={!p.tab.pinned && !p.group.locked ? "true" : "false"}
          onDragStart={(e) => {
            dragging = p.tab.id;
            setDragging(true);
            e.dataTransfer?.setData("text/plain", p.tab.id);
          }}
          onDragEnd={() => {
            dragging = null;
            setDragging(false);
          }}
          onDragOver={(e) => {
            if (dragging) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragging)
              relocate(dragging, {
                group: p.group.id,
                index: p.group.tabs.findIndex((t) => t.id === p.tab.id),
              });
            dragging = null;
            setDragging(false);
          }}
          onClick={() => publish(select(props.layout, p.tab.id), `${p.tab.title} selected`)}
          onKeyDown={(e) => {
            const i = p.group.tabs.findIndex((t) => t.id === p.tab.id);
            let next: number | undefined;
            if (e.key === "ArrowRight") next = (i + 1) % p.group.tabs.length;
            if (e.key === "ArrowLeft") next = (i + p.group.tabs.length - 1) % p.group.tabs.length;
            if (e.key === "Home") next = 0;
            if (e.key === "End") next = p.group.tabs.length - 1;
            if (next !== undefined) {
              e.preventDefault();
              const id = p.group.tabs[next].id;
              publish(select(props.layout, id), "Tab selected", id);
            }
            if (e.key === "Delete" && !p.tab.pinned) {
              e.preventDefault();
              dismiss(p.tab.id);
            }
          }}
        >
          {p.tab.pinned ? "• " : ""}
          {p.tab.title}
        </button>
        <button
          aria-label={`Move ${p.tab.title}`}
          disabled={p.tab.pinned || p.group.locked}
          onClick={() => setMoving(p.tab.id)}
        >
          ↗
        </button>
        <button
          aria-label={`Close ${p.tab.title}`}
          disabled={p.tab.pinned || p.group.locked}
          onClick={() => dismiss(p.tab.id)}
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <div
      class={["sw-workspace", { "sw-dragging": isDragging() }]}
      ref={(el) => {
        host = el;
      }}
      role="region"
      aria-label={props.label ?? "Workspace"}
    >
      <For each={props.renderTab ? tabs() : []} keyed={(t) => t.id}>
        {(tab) => {
          const box = () => tabBoxes().get(tab().id);
          const presented = () => box()?.node.selected === tab().id;
          const content = props.renderTab?.(tab, presented);
          return (
            <div
              class="sw-content"
              data-content-id={tab().id}
              role="tabpanel"
              aria-label={tab().title}
              hidden={!presented()}
              inert={!presented()}
              style={position(
                box()
                  ? { ...box()!, y: box()!.y + 36, height: Math.max(0, box()!.height - 36) }
                  : { x: 0, y: 0, width: 0, height: 0 },
              )}
            >
              {content}
            </div>
          );
        }}
      </For>
      <For each={boxes().groups} keyed={(g) => g.node.id}>
        {(g) => (
          <>
            <div
              class="sw-header"
              role="tablist"
              aria-label={`Group ${g().node.id}`}
              style={position({ ...g(), height: 36 })}
              onDragOver={(e) => {
                if (dragging) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging) relocate(dragging, { group: g().node.id });
                dragging = null;
                setDragging(false);
              }}
            >
              <For each={g().node.tabs} keyed={(t) => t.id}>
                {(t) => <TabButton tab={t()} group={g().node} />}
              </For>
            </div>
            <div
              class="sw-drop"
              style={position({ ...g(), y: g().y + 36, height: Math.max(0, g().height - 36) })}
              onDragOver={(e) => {
                if (dragging) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragging) return;
                const r = e.currentTarget.getBoundingClientRect(),
                  x = (e.clientX - r.left) / r.width,
                  y = (e.clientY - r.top) / r.height;
                const edge: Edge | undefined =
                  x < 0.2
                    ? "left"
                    : x > 0.8
                      ? "right"
                      : y < 0.2
                        ? "top"
                        : y > 0.8
                          ? "bottom"
                          : undefined;
                relocate(dragging, { group: g().node.id, edge });
                dragging = null;
                setDragging(false);
              }}
            />
          </>
        )}
      </For>
      <For each={boxes().splits} keyed={(s) => s.node.id}>
        {(s) => (
          <div
            class="sw-divider"
            role="separator"
            tabindex={0}
            aria-label="Resize panes"
            aria-orientation={s().node.axis === "horizontal" ? "vertical" : "horizontal"}
            aria-valuemin={10}
            aria-valuemax={90}
            aria-valuenow={Math.round(s().node.ratio * 100)}
            style={position(s())}
            onPointerDown={(e) => startResize(e, s().node.id, s().node.axis, s().parent)}
            onKeyDown={(e) => {
              const horizontal = s().node.axis === "horizontal";
              const delta =
                e.key === (horizontal ? "ArrowLeft" : "ArrowUp")
                  ? -0.05
                  : e.key === (horizontal ? "ArrowRight" : "ArrowDown")
                    ? 0.05
                    : 0;
              if (delta || e.key === "Home" || e.key === "End") {
                e.preventDefault();
                props.onChange(
                  resize(
                    props.layout,
                    s().node.id,
                    e.key === "Home" ? 0.1 : e.key === "End" ? 0.9 : s().node.ratio + delta,
                  ),
                );
              }
            }}
          />
        )}
      </For>
      <div class="sw-announcement" aria-live="polite">
        {announcement()}
      </div>
      <div
        class="sw-move"
        hidden={!moving()}
        role="dialog"
        aria-label="Move tab"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            const id = moving();
            setMoving(null);
            if (id) focusTab(id);
          }
        }}
      >
        <p>Move tab to:</p>
        <For each={boxes().groups} keyed={(g) => g.node.id}>
          {(g) => (
            <div>
              {g()
                .node.tabs.map((t) => t.title)
                .join(", ") || "Empty group"}
              <For each={["center", "left", "right", "top", "bottom"] as const}>
                {(edge) => (
                  <button
                    onClick={() => {
                      const id = moving();
                      if (id)
                        relocate(id, {
                          group: g().node.id,
                          edge: edge === "center" ? undefined : edge,
                        });
                    }}
                  >
                    {edge}
                  </button>
                )}
              </For>
            </div>
          )}
        </For>
        <button
          onClick={() => {
            const id = moving();
            setMoving(null);
            if (id) focusTab(id);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
