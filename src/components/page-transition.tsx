import { ViewTransition } from "react";

const CLASS_MAP = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "auto",
} as const;

/**
 * Wrap each page's content (not the layout — layouts persist, so enter/exit
 * never fire there). Links tag direction via `transitionTypes`:
 * `nav-forward` slides deeper, `nav-back` returns, everything else
 * (sidebar clicks, browser back) crossfades via `default: "auto"`.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransition enter={{ ...CLASS_MAP }} exit={{ ...CLASS_MAP }}>
      {children}
    </ViewTransition>
  );
}
