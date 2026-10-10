"use client";

import type { CSSProperties } from "react";
import type { BrandConnectConfig } from "@/types";
import { trackPromotionClick } from "@/utils/tracking";
import styles from "./ads.module.css";

interface Props {
  config: BrandConnectConfig;
}

/** 상품 하나의 대략적인 폭(px) — 흐르는 속도를 맞추는 데만 쓴다 */
const ITEM_WIDTH = 250;
/** 끊김 없이 돌도록 같은 목록을 세 번 이어 붙이고 1/3만큼 움직인다 */
const COPIES = 3;

/**
 * 브랜드커넥트 한 줄 띠 — 작은 상품 사진과 이름이 옆으로 천천히 흐른다.
 * 마우스를 올리거나 키보드로 들어오면 멈추고, 움직임 줄이기 설정이면 손으로 넘겨 보는 목록이 된다.
 */
export function BrandConnectBanner({ config }: Props) {
  const { products } = config;
  if (!config.enabled || products.length === 0) return null;

  const loop = config.autoScroll && products.length > 1;
  const copies = loop ? COPIES : 1;
  const style = {
    "--brand-duration": `${((products.length * ITEM_WIDTH) / config.scrollSpeed).toFixed(1)}s`,
  } as CSSProperties;

  return (
    <aside className={styles.brand} aria-labelledby="brand-title">
      <span id="brand-title" className={styles.brandTitle}>
        {config.title}
      </span>

      <div className={styles.brandViewport} data-loop={loop || undefined}>
        <ul className={styles.brandTrack} style={style}>
          {Array.from({ length: copies }, (_, copy) =>
            products.map((p, i) => {
              const clone = copy > 0;
              return (
                <li key={`${copy}-${i}`} className={styles.brandItem} aria-hidden={clone || undefined}>
                  <a
                    className={styles.brandLink}
                    href={p.href}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    tabIndex={clone ? -1 : undefined}
                    onClick={() => trackPromotionClick({ type: "brand-connect", position: config.position })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 정적 내보내기라 이미지 최적화 서버가 없고, 작은 webp로 미리 줄여 둠 */}
                    <img
                      className={styles.brandImage}
                      src={p.image}
                      alt=""
                      width={36}
                      height={36}
                      decoding="async"
                    />
                    <span className={styles.brandName}>{p.name}</span>
                    <span className={styles.brandArrow} aria-hidden="true">
                      →
                    </span>
                  </a>
                </li>
              );
            }),
          )}
        </ul>
      </div>

      <p className={styles.disclosure}>{config.disclosureText}</p>
    </aside>
  );
}
