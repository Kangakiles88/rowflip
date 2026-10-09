"use client";

import { useEffect, useRef } from "react";
import { adsConfig } from "@/config/ads";
import styles from "./ads.module.css";

export interface AdSlotProps {
  slot?: string;
  format?: "auto" | "horizontal" | "rectangle";
  className?: string;
}

type AdsQueue = Record<string, unknown>[];

/** 설정이 없거나 꺼져 있으면 DOM에 아무것도 남기지 않는다. */
export function AdSlot({ slot, format = "auto", className }: AdSlotProps) {
  const pushed = useRef(false);
  const active = adsConfig.enabled && !!slot;

  useEffect(() => {
    if (!active || pushed.current) return;
    pushed.current = true;
    try {
      const w = window as unknown as { adsbygoogle?: AdsQueue };
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch {
      /* 광고 차단기 등 — 무시 */
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className={[styles.adSlot, className].filter(Boolean).join(" ")}>
      <span className={styles.adLabel}>광고</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adsConfig.clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
