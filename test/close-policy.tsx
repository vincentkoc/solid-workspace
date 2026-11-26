import { render } from "@solidjs/web";
import { Workspace, type Group, type Layout } from "../src";

export function watchCloseRequests() {
  const requests: string[] = [];
  const group = (id: string, locked: boolean): Group => ({
    kind: "group",
    id,
    locked,
    tabs: [{ id, title: id }],
    selected: id,
  });
  const layout: Layout = {
    version: 1,
    root: {
      kind: "split",
      id: "policy",
      axis: "horizontal",
      ratio: 0.5,
      first: group("Locked tab", true),
      second: group("Editable tab", false),
    },
  };
  const host = document.createElement("div");
  document.body.append(host);
  render(
    () => <Workspace layout={layout} onChange={() => {}} onCloseTab={(id) => requests.push(id)} />,
    host,
  );
  return requests;
}
