import Link from "next/link";
import { TOOL_GROUPS, TOOL_PAGES, type ToolPageId } from "@/config/nav";

/** 도구 아래 '다른 도구' 목록 — 지금 페이지를 뺀 기능 페이지를 묶음별로, 이름과 한 줄 설명으로 보여 준다. */
export function ToolDirectory({ current }: { current: ToolPageId }) {
  return (
    <nav className="toolDirectory" aria-labelledby="other-tools">
      <h2 id="other-tools">다른 도구</h2>
      {TOOL_GROUPS.map((g) => {
        const pages = TOOL_PAGES.filter((p) => p.group === g.id && p.id !== current);
        if (pages.length === 0) return null;
        return (
          <div key={g.id} className="toolGroup">
            <h3>{g.label}</h3>
            <ul>
              {pages.map((p) => (
                <li key={p.id}>
                  <Link href={p.href}>
                    <strong>{p.title}</strong>
                    <span>{p.desc}</span>
                    <span className="toolDirectoryArrow" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
