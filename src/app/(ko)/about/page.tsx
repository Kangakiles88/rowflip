import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { TOOL_GROUPS, TOOL_PAGES } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { ABOUT_META as M, ABOUT_UPDATES, LAUNCH_DATE, aboutSections } from "@/content/about";
import { BLOG_META, getPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: M.title,
  description: M.description,
  alternates: { canonical: M.path },
  openGraph: {
    type: "website",
    url: M.path,
    siteName: siteConfig.name,
    title: `${M.title} | ${siteConfig.name}`,
    description: M.description,
    locale: siteConfig.locale,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
};

const korDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
};

export default function AboutPage() {
  const [purpose, ...rest] = aboutSections(siteConfig.contactEmail);
  const postCount = getPosts().length;
  const section = (s: (typeof rest)[number]) => (
    <section key={s.id} id={s.id} className="policySection" aria-labelledby={`${s.id}-title`}>
      <h2 id={`${s.id}-title`}>{s.title}</h2>
      {s.body}
    </section>
  );
  return (
    <>
      <Header />
      <main className="container page">
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">
            엑셀·구글 시트 데이터를 붙여넣어 바로 변환하는 무료 도구 모음 · <time dateTime={LAUNCH_DATE}>{korDate(LAUNCH_DATE)}</time> 공개
          </p>
        </div>

        <div className="policy">
          {section(purpose)}

          <section id="tools" className="policySection" aria-labelledby="tools-title">
            <h2 id="tools-title">도구 목록</h2>
            <p>
              도구 {TOOL_PAGES.length}개와 엑셀 작업 방법을 정리한{" "}
              <Link className="inlineLink" href={BLOG_META.path}>
                블로그 글 {postCount}개
              </Link>
              가 있습니다.
            </p>
            {TOOL_GROUPS.map((g) => (
              <div key={g.id}>
                <h3 className="aboutGroup">{g.label}</h3>
                <ul>
                  {TOOL_PAGES.filter((p) => p.group === g.id).map((p) => (
                    <li key={p.id}>
                      <Link className="inlineLink" href={p.href}>
                        {p.title}
                      </Link>{" "}
                      — {p.desc}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {rest.slice(0, -1).map(section)}

          <section id="updates" className="policySection" aria-labelledby="updates-title">
            <h2 id="updates-title">업데이트 기록</h2>
            <ul>
              {ABOUT_UPDATES.map((u) => (
                <li key={u.date + u.text}>
                  <time dateTime={u.date}>{u.date.replaceAll("-", ".")}</time> {u.text}
                </li>
              ))}
            </ul>
          </section>

          {section(rest[rest.length - 1])}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
