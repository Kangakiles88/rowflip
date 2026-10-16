import { siteConfig } from "@/config/site";
import { BLOG_META, postPath, type PostMeta } from "@/content/blog";

/** 블로그 글 구조화 데이터: BlogPosting + BreadcrumbList(홈 > 엑셀 작업 팁 > 글) */
export function BlogJsonLd({ meta }: { meta: PostMeta }) {
  const url = `${siteConfig.url}${postPath(meta.slug)}`;
  const org = { "@type": "Organization", name: siteConfig.name, url: `${siteConfig.url}/` };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#post`,
        headline: meta.h1,
        description: meta.description,
        url,
        mainEntityOfPage: url,
        inLanguage: "ko-KR",
        datePublished: meta.published,
        dateModified: meta.updated ?? meta.published,
        keywords: meta.keywords.join(", "),
        image: `${siteConfig.url}/og.png`,
        author: org,
        publisher: org,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteConfig.name, item: `${siteConfig.url}/` },
          { "@type": "ListItem", position: 2, name: BLOG_META.h1, item: `${siteConfig.url}${BLOG_META.path}` },
          { "@type": "ListItem", position: 3, name: meta.h1, item: url },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
