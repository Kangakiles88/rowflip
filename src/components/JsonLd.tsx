import { siteConfig } from "@/config/site";
import type { FaqItem } from "@/content/seo";

interface Props {
  path: string;
  name: string;
  description: string;
  features: string[];
  faq: FaqItem[];
}

/** 페이지별 구조화 데이터: WebApplication + FAQPage + BreadcrumbList */
export function JsonLd({ path, name, description, features, faq }: Props) {
  const url = `${siteConfig.url}${path}`;
  const isHome = path === "/";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name,
      url,
      description,
      inLanguage: "ko-KR",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Windows, macOS, Android, iOS",
      browserRequirements: "JavaScript가 켜진 최신 브라우저",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      featureList: features,
      isPartOf: { "@type": "WebSite", name: siteConfig.name, url: `${siteConfig.url}/` },
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.plain },
      })),
    },
  ];
  if (!isHome) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteConfig.name, item: `${siteConfig.url}/` },
        { "@type": "ListItem", position: 2, name, item: url },
      ],
    });
  }
  const data = { "@context": "https://schema.org", "@graph": graph };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
