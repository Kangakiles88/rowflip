"use client";

import { useState } from "react";
import { loadLogoImage, loadSealImage } from "@/utils/sealImage";
import e from "./estimate.module.css";
import styles from "./tool.module.css";

/** 견적서·거래명세서에 찍는 직인·회사 로고. 이미지는 화면 상태로만 들고 저장하지 않는다 */

export interface DocSeal {
  src: string;
  /** 지름 mm */
  size: number;
}
export interface DocLogo {
  src: string;
  /** 높이 mm */
  height: number;
}

const SEAL_SIZES = [12, 15, 18, 22];
const LOGO_HEIGHTS = [8, 12, 16, 20];

export function useDocImages() {
  const [seal, setSeal] = useState<DocSeal | null>(null);
  const [logo, setLogo] = useState<DocLogo | null>(null);
  const [error, setError] = useState("");
  return { seal, setSeal, logo, setLogo, error, setError };
}

type DocImagesState = ReturnType<typeof useDocImages>;

function Picker({
  label,
  has,
  pickLabel,
  onFile,
  sizes,
  size,
  onSize,
  sizeLabel,
  onRemove,
}: {
  label: string;
  has: boolean;
  pickLabel: string;
  onFile: (file: File) => void;
  sizes: number[];
  size: number;
  onSize: (n: number) => void;
  sizeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className={styles.certRow}>
      <span>{label}</span>
      <span className={styles.inline}>
        <label className={styles.fileBtn}>
          {has ? `${pickLabel} 바꾸기` : `${pickLabel} 넣기`}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) onFile(f);
              ev.target.value = "";
            }}
          />
        </label>
        {has && (
          <>
            <select
              aria-label={sizeLabel}
              className={styles.select}
              value={size}
              onChange={(ev) => onSize(Number(ev.target.value))}
            >
              {sizes.map((n) => (
                <option key={n} value={n}>
                  {n}mm
                </option>
              ))}
            </select>
            <button type="button" className={styles.outlineBtn} onClick={onRemove}>
              빼기
            </button>
          </>
        )}
      </span>
    </div>
  );
}

/** 입력 패널의 '직인·로고' 묶음 */
export function DocImageFields({ state }: { state: DocImagesState }) {
  const { seal, setSeal, logo, setLogo, error, setError } = state;
  const load = async (kind: "seal" | "logo", file: File) => {
    setError("");
    try {
      if (kind === "seal") {
        const src = await loadSealImage(file);
        setSeal((s) => ({ src, size: s?.size ?? 15 }));
      } else {
        const src = await loadLogoImage(file);
        setLogo((l) => ({ src, height: l?.height ?? 12 }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지를 읽지 못했습니다.");
    }
  };

  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupTitle}>직인·로고</legend>
      <Picker
        label="직인"
        has={!!seal}
        pickLabel="직인 이미지"
        onFile={(f) => void load("seal", f)}
        sizes={SEAL_SIZES}
        size={seal?.size ?? 15}
        onSize={(size) => setSeal((s) => (s ? { ...s, size } : s))}
        sizeLabel="직인 크기"
        onRemove={() => setSeal(null)}
      />
      <Picker
        label="로고"
        has={!!logo}
        pickLabel="로고 이미지"
        onFile={(f) => void load("logo", f)}
        sizes={LOGO_HEIGHTS}
        size={logo?.height ?? 12}
        onSize={(height) => setLogo((l) => (l ? { ...l, height } : l))}
        sizeLabel="로고 높이"
        onRemove={() => setLogo(null)}
      />
      {error ? (
        <p className={styles.hintStrong}>{error}</p>
      ) : (
        <p className={styles.hint}>
          직인은 흰 바탕을 지우고 공급자 성명 옆 (인) 자리에 찍습니다. 로고는 제목 왼쪽에 넣습니다. 이미지는 저장하지 않습니다.
        </p>
      )}
    </fieldset>
  );
}

/** 성명 칸의 (인) — 직인이 있으면 그 위에 겹쳐 찍는다 */
export function SealMark({ seal }: { seal?: DocSeal | null }) {
  return (
    <span className={e.seal}>
      (인)
      {seal && (
        /* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 이미지(데이터 주소)라 최적화 대상이 아님 */
        <img
          className={e.sealImg}
          src={seal.src}
          alt="직인"
          style={{ width: `calc(${seal.size} * var(--mm))`, height: `calc(${seal.size} * var(--mm))` }}
        />
      )}
    </span>
  );
}

/** 제목 왼쪽 로고 */
export function LogoMark({ logo }: { logo?: DocLogo | null }) {
  if (!logo) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 이미지(데이터 주소)라 최적화 대상이 아님 */
    <img
      className={e.logo}
      src={logo.src}
      alt="회사 로고"
      style={{ height: `calc(${logo.height} * var(--mm))` }}
    />
  );
}
