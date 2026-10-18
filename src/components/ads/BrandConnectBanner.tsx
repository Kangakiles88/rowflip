"use client";

import { useEffect, useState } from "react";
import type { BrandConnectConfig } from "@/types";
import { nextRotationIndex } from "@/utils/rotation";
import { trackPromotionClick } from "@/utils/tracking";
import styles from "./ads.module.css";

interface Props {
  config: BrandConnectConfig;
}

/** 마지막으로 보여 준 상품 순번 — 새로고침하면 다음 상품을 보여 준다 */
const ROTATION_KEY = "rowflip:brand-rotation:v1";

/**
 * 브랜드커넥트 띠 — 상품 하나를 가운데에 보여 주고, 새로고침할 때마다 다음 상품으로 바뀐다.
 * 띠 전체가 링크라 어디를 눌러도 상품 페이지로 간다(대가성 안내 문구도 띠 안에 항상 보인다).
 * 어떤 상품을 보여 줄지는 브라우저에서 정하므로, 그 전까지는 같은 높이의 빈 띠로 자리만 잡아 둔다.
 */
export function BrandConnectBanner({ config }: Props) {
  const { products } = config;
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(ROTATION_KEY);
    } catch {
      /* 저장소를 못 쓰면 매번 무작위 */
    }
    const next = nextRotationIndex(stored, products.length, Math.random());
    try {
      window.localStorage.setItem(ROTATION_KEY, String(next));
    } catch {
      /* 무시 */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저 저장값으로 마운트 후 1회 결정
    setIndex(next);
  }, [products.length]);

  if (!config.enabled || products.length === 0) return null;
  const p = index === null ? null : products[index];

  return (
    <aside className={styles.brand} aria-label={config.title}>
      {p ? (
        <a
          key={index}
          className={styles.brandLink}
          href={p.href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          onClick={() => trackPromotionClick({ type: "brand-connect", position: config.position })}
        >
          <span className={styles.brandRow}>
            <span className={styles.brandTitle}>{config.title}</span>
            {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 이미지 최적화 서버가 없고, 작은 webp로 미리 줄여 둠 */}
            <img className={styles.brandImage} src={p.image} alt="" width={44} height={44} decoding="async" />
            <span className={styles.brandName}>{p.name}</span>
            <span className={styles.brandCta}>
              상품 보기<span aria-hidden="true"> →</span>
            </span>
          </span>
          <span className={styles.disclosure}>{p.disclosure ?? config.disclosureText}</span>
        </a>
      ) : (
        <span className={styles.brandPlaceholder} aria-hidden="true" />
      )}
    </aside>
  );
}
