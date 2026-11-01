import { close as e, groups as t, move as n, parseLayout as r, resize as i, select as a } from "./model.js";
import { createComponent as o, delegateEvents as s, effect as c, insert as l, memo as u, readShallow as d, ref as f, setAttribute as p, style as m, template as h } from "@solidjs/web";
import { For as g, createEffect as _, createMemo as v, createSignal as y, onCleanup as b, onSettled as x } from "solid-js";
// src/geometry.ts
function S(e, t, n) {
	let r = {
		groups: [],
		splits: []
	};
	function i(e, t) {
		if (e.kind === "group") {
			r.groups.push({
				...t,
				node: e
			});
			return;
		}
		let n = e.axis === "horizontal", a = n ? t.width : t.height, o = Math.max(0, a - 6), s = o * e.ratio, c = { ...t }, l = { ...t }, u = { ...t };
		n ? (c.width = s, l.x += s + 6, l.width = o - s, u.x += s, u.width = 6) : (c.height = s, l.y += s + 6, l.height = o - s, u.y += s, u.height = 6), r.splits.push({
			...u,
			node: e,
			parent: t
		}), i(e.first, c), i(e.second, l);
	}
	return i(e, {
		x: 0,
		y: 0,
		width: Math.max(0, t),
		height: Math.max(0, n)
	}), r;
}
// src/workspace.tsx
var C = /* @__PURE__ */ h("<span class=sw-tab-wrap><button role=tab><!><!></button><button>↗</button><button>×"), w = /* @__PURE__ */ h("<div class=sw-workspace role=region><!><!><div class=sw-announcement aria-live=polite></div><div class=sw-move role=dialog aria-label=\"Move tab\"><p>Move tab to:</p><button>Cancel"), ee = /* @__PURE__ */ h("<div class=sw-content role=tabpanel>"), T = /* @__PURE__ */ h("<div class=sw-header role=tablist>"), E = /* @__PURE__ */ h("<div class=sw-drop>"), D = /* @__PURE__ */ h("<div class=sw-divider role=separator tabindex=0 aria-label=\"Resize panes\"aria-valuemin=10 aria-valuemax=90>"), O = /* @__PURE__ */ h("<div><!><!>"), k = /* @__PURE__ */ h("<button>"), A = (e) => ({
	left: `${e.x}px`,
	top: `${e.y}px`,
	width: `${e.width}px`,
	height: `${e.height}px`
});
function j(r) {
	let s, h = null, [j, M] = y(!1), N, [P, F] = y({
		width: 0,
		height: 0
	}), [I, te] = y(""), [L, R] = y(null), z = v(() => S(r.layout.root, P().width, P().height)), B = v(() => t(r.layout.root).flatMap((e) => e.tabs).sort((e, t) => e.id.localeCompare(t.id)));
	_(z, (e) => r.onGeometry?.(e));
	let V = v(() => new Map(z().groups.flatMap((e) => e.node.tabs.map((t) => [t.id, e])))), H = (n) => {
		if (r.onCloseTab) {
			r.onCloseTab(n);
			return;
		}
		let i = e(r.layout, n), a = t(i.root).find((e) => e.selected)?.selected;
		W(i, "Tab closed", a ?? void 0);
	}, U = (e) => x(() => {
		s.querySelector(`[data-tab-id="${CSS.escape(e)}"]`)?.focus();
	}), W = (e, t, n) => {
		e !== r.layout && (r.onChange(e), te(t), n && U(n));
	};
	function G(e, t) {
		let i = B().find((t) => t.id === e);
		if (!i || r.canDrop?.(i, t) === !1) return;
		let a = t.edge ? {
			...t,
			groupId: crypto.randomUUID(),
			splitId: crypto.randomUUID()
		} : t;
		W(n(r.layout, e, a), `${i.title} moved`, e), R(null);
	}
	x(() => {
		let e = new ResizeObserver((e) => {
			let t = e[0].contentRect;
			F({
				width: t.width,
				height: t.height
			});
		});
		return e.observe(s), () => e.disconnect();
	}), b(() => N?.());
	function K(e, t, n, a) {
		if (e.button !== 0) return;
		e.preventDefault(), N?.();
		let o = s.getBoundingClientRect(), c = (e) => {
			let s = n === "horizontal" ? e.clientX - o.left - a.x : e.clientY - o.top - a.y, c = (n === "horizontal" ? a.width : a.height) - 6;
			r.onChange(i(r.layout, t, s / Math.max(1, c)));
		}, l = () => {
			window.removeEventListener("pointermove", c), window.removeEventListener("pointerup", l), window.removeEventListener("pointercancel", l), N = void 0;
		};
		window.addEventListener("pointermove", c), window.addEventListener("pointerup", l), window.addEventListener("pointercancel", l), N = l;
	}
	function q(e) {
		var t = C(), n = t.firstChild, i = n.firstChild, o = i.nextSibling, s = n.nextSibling, u = s.nextSibling;
		return n._$$keydown = (t) => {
			let n = e.group.tabs.findIndex((t) => t.id === e.tab.id), i;
			if (t.key === "ArrowRight" && (i = (n + 1) % e.group.tabs.length), t.key === "ArrowLeft" && (i = (n + e.group.tabs.length - 1) % e.group.tabs.length), t.key === "Home" && (i = 0), t.key === "End" && (i = e.group.tabs.length - 1), i !== void 0) {
				t.preventDefault();
				let n = e.group.tabs[i].id;
				W(a(r.layout, n), "Tab selected", n);
			}
			t.key === "Delete" && !e.tab.pinned && (t.preventDefault(), H(e.tab.id));
		}, n._$$click = () => W(a(r.layout, e.tab.id), `${e.tab.title} selected`), n.addEventListener("drop", (t) => {
			t.preventDefault(), t.stopPropagation(), h && G(h, {
				group: e.group.id,
				index: e.group.tabs.findIndex((t) => t.id === e.tab.id)
			}), h = null, M(!1);
		}), n.addEventListener("dragover", (e) => {
			h && e.preventDefault();
		}), n.addEventListener("dragend", () => {
			h = null, M(!1);
		}), n.addEventListener("dragstart", (t) => {
			h = e.tab.id, M(!0), t.dataTransfer?.setData("text/plain", e.tab.id);
		}), l(n, () => e.tab.pinned ? "• " : "", i), l(n, () => e.tab.title, o), s._$$click = () => R(e.tab.id), u._$$click = () => H(e.tab.id), c(() => ({
			e: e.tab.id,
			t: e.group.selected === e.tab.id ? "true" : "false",
			a: e.group.selected === e.tab.id ? 0 : -1,
			o: !e.tab.pinned && !e.group.locked ? "true" : "false",
			i: `Move ${e.tab.title}`,
			n: e.tab.pinned || e.group.locked,
			s: `Close ${e.tab.title}`,
			h: e.tab.pinned || e.group.locked
		}), ({ e, t, a: r, o: i, i: a, n: o, s: c, h: l }, d) => {
			e !== d?.e && p(n, "data-tab-id", e), t !== d?.t && p(n, "aria-selected", t), r !== d?.a && p(n, "tabindex", r), i !== d?.o && p(n, "draggable", i), a !== d?.i && p(s, "aria-label", a), o !== d?.n && p(s, "disabled", o), c !== d?.s && p(u, "aria-label", c), l !== d?.h && p(u, "disabled", l);
		}), t;
	}
	var J = w(), Y = J.firstChild, X = Y.nextSibling, Z = X.nextSibling, Q = Z.nextSibling, $ = Q.firstChild.nextSibling;
	return f(() => (e) => {
		s = e;
	}, J), l(J, o(g, {
		get each() {
			return u(() => !!r.renderTab)() ? B() : [];
		},
		keyed: (e) => e.id,
		children: (e) => {
			let t = () => V().get(e().id), n = () => t()?.node.selected === e().id, i = r.renderTab?.(e, n);
			var a = ee();
			return l(a, i), c(() => ({
				e: e().id,
				t: e().title,
				a: !n(),
				o: !n(),
				i: d(A(t() ? {
					...t(),
					y: t().y + 36,
					height: Math.max(0, t().height - 36)
				} : {
					x: 0,
					y: 0,
					width: 0,
					height: 0
				}))
			}), ({ e, t, a: n, o: r, i }, o) => {
				e !== o?.e && p(a, "data-content-id", e), t !== o?.t && p(a, "aria-label", t), n !== o?.a && p(a, "hidden", n), r !== o?.o && p(a, "inert", r), m(a, i, o?.i);
			}), a;
		}
	}), Y), l(J, o(g, {
		get each() {
			return z().groups;
		},
		keyed: (e) => e.node.id,
		children: (e) => [(() => {
			var t = T();
			return t.addEventListener("drop", (t) => {
				t.preventDefault(), h && G(h, { group: e().node.id }), h = null, M(!1);
			}), t.addEventListener("dragover", (e) => {
				h && e.preventDefault();
			}), l(t, o(g, {
				get each() {
					return e().node.tabs;
				},
				keyed: (e) => e.id,
				children: (t) => o(q, {
					get tab() {
						return t();
					},
					get group() {
						return e().node;
					}
				})
			})), c(() => ({
				e: `Group ${e().node.id}`,
				t: d(A({
					...e(),
					height: 36
				}))
			}), ({ e, t: n }, r) => {
				e !== r?.e && p(t, "aria-label", e), m(t, n, r?.t);
			}), t;
		})(), (() => {
			var t = E();
			return t.addEventListener("drop", (t) => {
				if (t.preventDefault(), !h) return;
				let n = t.currentTarget.getBoundingClientRect(), r = (t.clientX - n.left) / n.width, i = (t.clientY - n.top) / n.height, a = r < .2 ? "left" : r > .8 ? "right" : i < .2 ? "top" : i > .8 ? "bottom" : void 0;
				G(h, {
					group: e().node.id,
					edge: a
				}), h = null, M(!1);
			}), t.addEventListener("dragover", (e) => {
				h && e.preventDefault();
			}), c(() => d(A({
				...e(),
				y: e().y + 36,
				height: Math.max(0, e().height - 36)
			})), (e, n) => {
				m(t, e, n);
			}), t;
		})()]
	}), X), l(J, o(g, {
		get each() {
			return z().splits;
		},
		keyed: (e) => e.node.id,
		children: (e) => (() => {
			var t = D();
			return t._$$keydown = (t) => {
				let n = e().node.axis === "horizontal", a = t.key === (n ? "ArrowLeft" : "ArrowUp") ? -.05 : t.key === (n ? "ArrowRight" : "ArrowDown") ? .05 : 0;
				(a || t.key === "Home" || t.key === "End") && (t.preventDefault(), r.onChange(i(r.layout, e().node.id, t.key === "Home" ? .1 : t.key === "End" ? .9 : e().node.ratio + a)));
			}, t._$$pointerdown = (t) => K(t, e().node.id, e().node.axis, e().parent), c(() => ({
				e: e().node.axis === "horizontal" ? "vertical" : "horizontal",
				t: Math.round(e().node.ratio * 100),
				a: d(A(e()))
			}), ({ e, t: n, a: r }, i) => {
				e !== i?.e && p(t, "aria-orientation", e), n !== i?.t && p(t, "aria-valuenow", n), m(t, r, i?.a);
			}), t;
		})()
	}), Z), l(Z, I), Q._$$keydown = (e) => {
		if (e.key === "Escape") {
			let e = L();
			R(null), e && U(e);
		}
	}, l(Q, o(g, {
		get each() {
			return z().groups;
		},
		keyed: (e) => e.node.id,
		children: (e) => (() => {
			var t = O(), n = t.firstChild, r = n.nextSibling;
			return l(t, () => e().node.tabs.map((e) => e.title).join(", ") || "Empty group", n), l(t, o(g, {
				each: [
					"center",
					"left",
					"right",
					"top",
					"bottom"
				],
				children: (t) => (() => {
					var n = k();
					return n._$$click = () => {
						let n = L();
						n && G(n, {
							group: e().node.id,
							edge: t === "center" ? void 0 : t
						});
					}, l(n, t), n;
				})()
			}), r), t;
		})()
	}), $), $._$$click = () => {
		let e = L();
		R(null), e && U(e);
	}, c(() => ({
		e: !!j(),
		t: r.label ?? "Workspace",
		a: !L()
	}), ({ e, t, a: n }, r) => {
		e !== r?.e && J.classList.toggle("sw-dragging", e), t !== r?.t && p(J, "aria-label", t), n !== r?.a && p(Q, "hidden", n);
	}), J;
}
s([
	"click",
	"keydown",
	"pointerdown"
]);
export { j as Workspace, e as close, S as geometry, t as groups, n as move, r as parseLayout, i as resize, a as select };
