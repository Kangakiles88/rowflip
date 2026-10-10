import Link from "next/link";
import { TOOL_PAGES, type ToolPageId } from "@/config/nav";

/** 도구 바로 아래에 두는 '다른 도구' 목록 — 지금 페이지를 뺀 기능 페이지를 이름과 한 줄 설명으로 보여 준다. */
export function ToolDirectory({ current }: { current: ToolPageId }) {
  const others = TOOL_PAGES.filter((p) => p.id !== current);
  return (
    <nav className="toolDirectory" aria-labelledby="other-tools">
      <h2 id="other-tools">다른 도구</h2>
      <ul>
        {others.map((p) => (
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
    </nav>
  );
}
