import { type Element } from "solid-js";
import { type Drop, type Layout, type Tab } from "./model.js";
import { type Geometry } from "./geometry.js";
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
/** Content hosts never change parent or order when the layout changes. */
export declare function Workspace(props: WorkspaceProps): import("@solidjs/web/jsx-runtime").JSX.Element;
