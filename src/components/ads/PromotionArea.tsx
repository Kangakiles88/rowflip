import { adsConfig } from "@/config/ads";
import { brandConnectConfig } from "@/config/brandConnect";
import type { PromotionPosition } from "@/types";
import { AdSlot } from "./AdSlot";
import { BrandConnectBanner } from "./BrandConnectBanner";
import styles from "./ads.module.css";

interface Props {
  position: PromotionPosition;
  showAdsense?: boolean;
  showBrandConnect?: boolean;
}

/** AdSense 슬롯이 배정된 위치 — top/bottom 두 개만 운용한다. */
const ADSENSE_SLOT_BY_POSITION: Partial<Record<PromotionPosition, string>> = {
  top: adsConfig.slots.top,
  bottom: adsConfig.slots.bottom,
};

/**
 * 한 위치에 어떤 광고를 보여줄지 결정한다.
 * 보여줄 게 하나도 없으면 래퍼 요소도 만들지 않는다.
 */
export function PromotionArea({ position, showAdsense = true, showBrandConnect = true }: Props) {
  const adSlot = ADSENSE_SLOT_BY_POSITION[position];
  const renderAd = showAdsense && adsConfig.enabled && !!adSlot;
  const renderBrand =
    showBrandConnect && brandConnectConfig.enabled && brandConnectConfig.position === position;

  if (!renderAd && !renderBrand) return null;

  return (
    <div className={styles.area} data-position={position}>
      {renderBrand && <BrandConnectBanner config={brandConnectConfig} />}
      {renderAd && (
        <AdSlot slot={adSlot} format={position === "top" ? "horizontal" : "auto"} />
      )}
    </div>
  );
}
