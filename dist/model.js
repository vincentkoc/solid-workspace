// src/model.ts
function e(t) {
	return t.kind === "group" ? [t] : [...e(t.first), ...e(t.second)];
}
function t(e, n) {
	return n(e.kind === "group" ? e : {
		...e,
		first: t(e.first, n),
		second: t(e.second, n)
	});
}
function n(e) {
	if (e.kind === "group") return e;
	let t = n(e.first), r = n(e.second);
	return t.kind === "group" && !t.tabs.length ? r : r.kind === "group" && !r.tabs.length ? t : {
		...e,
		first: t,
		second: r
	};
}
function r(e, n) {
	return {
		...e,
		root: t(e.root, (e) => e.kind === "group" && e.tabs.some((e) => e.id === n) ? {
			...e,
			selected: n
		} : e)
	};
}
function i(r, i) {
	let a = e(r.root).find((e) => e.tabs.some((e) => e.id === i));
	return !a || a.locked || a.tabs.find((e) => e.id === i)?.pinned ? r : {
		...r,
		root: n(t(r.root, (e) => {
			if (e.id !== a.id || e.kind !== "group") return e;
			let t = e.tabs.findIndex((e) => e.id === i), n = e.tabs.filter((e) => e.id !== i);
			return {
				...e,
				tabs: n,
				selected: e.selected === i ? n[Math.min(t, n.length - 1)]?.id ?? null : e.selected
			};
		}))
	};
}
function a(r, i, a) {
	let o = e(r.root), s = o.find((e) => e.tabs.some((e) => e.id === i)), c = o.find((e) => e.id === a.group), l = s?.tabs.find((e) => e.id === i);
	if (!s || !c || !l || s.locked || c.locked || l.pinned || a.edge && s.id === c.id && s.tabs.length === 1) return r;
	let u = /* @__PURE__ */ new Set();
	if (t(r.root, (e) => (u.add(e.id), e)), a.edge && (!a.groupId || !a.splitId || a.groupId === a.splitId || u.has(a.groupId) || u.has(a.splitId)) || a.index !== void 0 && (!Number.isInteger(a.index) || a.index < 0 || a.index > c.tabs.length)) return r;
	let d = a.index ?? c.tabs.length;
	s.id === c.id && s.tabs.findIndex((e) => e.id === i) < d && d--;
	let f = c.tabs.filter((e) => e.pinned).length;
	if (!a.edge && d < f) return r;
	let p = t(r.root, (e) => {
		if (e.kind !== "group" || e.id !== s.id) return e;
		let t = e.tabs.filter((e) => e.id !== i);
		return {
			...e,
			tabs: t,
			selected: e.selected === i ? t[0]?.id ?? null : e.selected
		};
	});
	return p = t(p, (e) => {
		if (e.kind !== "group" || e.id !== c.id) return e;
		if (!a.edge) {
			let t = [...e.tabs];
			return t.splice(d, 0, l), {
				...e,
				tabs: t,
				selected: i
			};
		}
		let t = {
			kind: "group",
			id: a.groupId,
			tabs: [l],
			selected: i
		}, n = a.edge === "left" || a.edge === "top";
		return {
			kind: "split",
			id: a.splitId,
			axis: a.edge === "left" || a.edge === "right" ? "horizontal" : "vertical",
			ratio: .5,
			first: n ? t : e,
			second: n ? e : t
		};
	}), {
		...r,
		root: n(p)
	};
}
function o(e, n, r) {
	return Number.isFinite(r) ? {
		...e,
		root: t(e.root, (e) => e.id === n && e.kind === "split" ? {
			...e,
			ratio: Math.min(.9, Math.max(.1, r))
		} : e)
	} : e;
}
function s(e) {
	let t = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set();
	function r(e) {
		if (!e || typeof e != "object" || Array.isArray(e)) throw Error("Invalid layout object");
		return e;
	}
	function i(e, t) {
		if (typeof e != "string" || !e || t.has(e)) throw Error("Invalid or duplicate id");
		return t.add(e), e;
	}
	function a(e, o) {
		if (o > 32) throw Error("Layout too deep");
		let s = r(e), c = i(s.id, t);
		if (s.kind === "split") {
			if (s.axis !== "horizontal" && s.axis !== "vertical" || typeof s.ratio != "number" || !Number.isFinite(s.ratio) || s.ratio < .1 || s.ratio > .9) throw Error("Invalid split");
			return {
				kind: "split",
				id: c,
				axis: s.axis,
				ratio: s.ratio,
				first: a(s.first, o + 1),
				second: a(s.second, o + 1)
			};
		}
		if (s.kind !== "group" || !Array.isArray(s.tabs) || s.locked !== void 0 && typeof s.locked != "boolean") throw Error("Invalid group");
		let l = s.tabs.map((e) => {
			let t = r(e);
			if (typeof t.title != "string" || t.pinned !== void 0 && typeof t.pinned != "boolean") throw Error("Invalid tab");
			return {
				id: i(t.id, n),
				title: t.title,
				...t.pinned === void 0 ? {} : { pinned: t.pinned }
			};
		});
		if (l.length ? !l.some((e) => e.id === s.selected) : s.selected !== null) throw Error("Invalid selection");
		let u = !1;
		for (let e of l) {
			if (e.pinned && u) throw Error("Pinned tabs must precede other tabs");
			e.pinned || (u = !0);
		}
		return {
			kind: "group",
			id: c,
			tabs: l,
			selected: s.selected,
			...s.locked === void 0 ? {} : { locked: s.locked }
		};
	}
	let o = r(e);
	if (o.version !== 1) throw Error("Unsupported layout version");
	return {
		version: 1,
		root: a(o.root, 0)
	};
}
export { i as close, e as groups, a as move, s as parseLayout, o as resize, r as select };
