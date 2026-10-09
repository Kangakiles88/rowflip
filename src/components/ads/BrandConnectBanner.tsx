"use client";

import type { BrandConnectBannerConfig } from "@/types";
import { trackPromotionClick } from "@/utils/tracking";
import styles from "./ads.module.css";

interface Props {
  config: BrandConnectBannerConfig;
}

export function BrandConnectBanner({ config }: Props) {
  if (!config.enabled || !config.href) return null;

  const desktop = config.desktopImage || "";
  const mobile = config.mobileImage || desktop;
  const hasImage = desktop !== "";

  return (
    <aside className={styles.brand} aria-label="추천 상품">
      <a
        className={styles.brandLink}
        href={config.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackPromotionClick({ type: "brand-connect", position: config.position })}
      >
        {hasImage && (
          <picture className={styles.brandMedia}>
            <source media="(max-width: 640px)" srcSet={mobile} />
            <img src={desktop} alt={config.imageAlt ?? ""} loading="lazy" decoding="async" />
          </picture>
        )}
        <span className={styles.brandBody}>
          {config.title && <span className={styles.brandTitle}>{config.title}</span>}
          {config.description && <span className={styles.brandDesc}>{config.description}</span>}
        </span>
        <span className={styles.brandCta}>
          {config.ctaText || "자세히 보기"}
          <span aria-hidden="true"> →</span>
        </span>
      </a>
      {config.disclosureText && <p className={styles.disclosure}>{config.disclosureText}</p>}
    </aside>
  );
}
