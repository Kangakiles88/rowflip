import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { siteConfig } from "@/config/site";
import { EFFECTIVE_DATE, PRIVACY_META as M, privacySections } from "@/content/privacy";

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

const [y, m, d] = EFFECTIVE_DATE.split("-").map(Number);

export default function PrivacyPage() {
  const sections = privacySections(siteConfig.contactEmail);
  return (
    <>
      <Header />
      <main className="container page">
        <div className="intro">
          <h1>{M.h1}</h1>
          <p className="lede">
            시행일 <time dateTime={EFFECTIVE_DATE}>{`${y}년 ${m}월 ${d}일`}</time>
          </p>
        </div>

        <div className="policy">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="policySection" aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`}>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
