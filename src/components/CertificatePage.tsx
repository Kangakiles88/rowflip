import { useId, type CSSProperties } from "react";
import type { Certificate } from "@/utils/certificate";
import s from "./certificate.module.css";

/** line = 이중선 테두리, pattern = 전통 회문(回紋) 테두리, paper = 테두리 없이 글자만(상장 용지에 인쇄) */
export type CertDesign = "line" | "pattern" | "paper";
export type CertColor = "gold" | "ink";

export interface PaperLayout {
  /** 상장 용지 테두리 안쪽 여백(mm) — 글자가 이 안에만 들어간다 */
  margin: number;
  /** 글자 전체를 옮기는 거리(mm). +면 오른쪽·아래 */
  shiftX: number;
  shiftY: number;
}

interface Props {
  cert: Certificate;
  font: "serif" | "sans";
  design?: CertDesign;
  color?: CertColor;
  paper?: PaperLayout;
  /** 직인 이미지(흰 바탕을 지운 PNG 데이터 주소)와 크기(mm) */
  seal?: { src: string; size: number } | null;
  /** 미리보기면 칸 너비에 맞춰 줄이고, 빈 발급 기관 자리에 안내를 보여 준다 */
  preview?: boolean;
}

/** 회문 테두리 — 1단위 = 1mm(viewBox 210×297). 색은 currentColor(CSS 토큰) */
const KEY_H = "M0 6.2 H7 M6.2 6.2 V0.8 H1.6 V4.6 H4.6 V2.4 H3.1"; // 가로 띠 한 칸(아래 선이 이어짐)
const KEY_V = "M6.2 0 V7 M6.2 6.2 H0.8 V1.6 H4.6 V4.6 H2.4 V3.1"; // 세로 띠 한 칸(오른쪽 선이 이어짐)

function PatternBorder() {
  // 인쇄 포털·미리보기·크게 보기에 같은 SVG가 여러 개라 무늬 id가 겹치지 않게
  const uid = useId().replace(/:/g, "");
  const W = 210;
  const H = 297;
  const o = 9; // 바깥 선
  const band = 7; // 문양 띠 폭
  const i0 = o + 1.6; // 띠 시작
  const i1 = i0 + band; // 띠 끝
  // 띠 길이를 칸 수로 나눠 칸 너비를 살짝 맞춘다 — 모서리에서 무늬가 잘리지 않게
  const lh = W - i1 * 2;
  const lv = H - i1 * 2;
  const th = lh / Math.round(lh / band);
  const tv = lv / Math.round(lv / band);
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 0.55, strokeLinecap: "square" as const };
  const bottomC = H - i1 + band / 2;
  const rightC = W - i1 + band / 2;
  return (
    <svg className={s.deco} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id={`kt${uid}`} width={th} height={band} patternUnits="userSpaceOnUse" x={i1} y={i0}>
          <path d={KEY_H} transform={`scale(${th / band} 1)`} {...line} />
        </pattern>
        {/* 아래 띠는 위 띠를 위아래로 뒤집어 이어지는 선이 안쪽에 오게 */}
        <pattern
          id={`kb${uid}`}
          width={th}
          height={band}
          patternUnits="userSpaceOnUse"
          x={i1}
          y={H - i1}
          patternTransform={`translate(0 ${bottomC * 2}) scale(1 -1)`}
        >
          <path d={KEY_H} transform={`scale(${th / band} 1)`} {...line} />
        </pattern>
        <pattern id={`kl${uid}`} width={band} height={tv} patternUnits="userSpaceOnUse" x={i0} y={i1}>
          <path d={KEY_V} transform={`scale(1 ${tv / band})`} {...line} />
        </pattern>
        <pattern
          id={`kr${uid}`}
          width={band}
          height={tv}
          patternUnits="userSpaceOnUse"
          x={W - i1}
          y={i1}
          patternTransform={`translate(${rightC * 2} 0) scale(-1 1)`}
        >
          <path d={KEY_V} transform={`scale(1 ${tv / band})`} {...line} />
        </pattern>
      </defs>
      {/* 바깥 굵은 선 · 안쪽 가는 선 */}
      <rect x={o} y={o} width={W - o * 2} height={H - o * 2} fill="none" stroke="currentColor" strokeWidth={1.1} />
      <rect
        x={i1 + 1.6}
        y={i1 + 1.6}
        width={W - (i1 + 1.6) * 2}
        height={H - (i1 + 1.6) * 2}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.4}
      />
      {/* 문양 띠 4변(모서리는 따로) */}
      <rect x={i1} y={i0} width={lh} height={band} fill={`url(#kt${uid})`} />
      <rect x={i1} y={H - i1} width={lh} height={band} fill={`url(#kb${uid})`} />
      <rect x={i0} y={i1} width={band} height={lv} fill={`url(#kl${uid})`} />
      <rect x={W - i1} y={i1} width={band} height={lv} fill={`url(#kr${uid})`} />
      {/* 네 모서리 — 겹사각 매듭 */}
      {[
        [i0, i0],
        [W - i1, i0],
        [i0, H - i1],
        [W - i1, H - i1],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} fill="none" stroke="currentColor" strokeWidth={0.55}>
          <rect x={x + 0.6} y={y + 0.6} width={band - 1.2} height={band - 1.2} />
          <rect x={x + 2.1} y={y + 2.1} width={band - 4.2} height={band - 4.2} />
        </g>
      ))}
    </svg>
  );
}

/** 상장·수료증 한 장(A4 세로) */
export function CertificatePage({ cert, font, design = "line", color = "ink", paper, seal, preview = false }: Props) {
  const cls = [s.page, preview ? s.preview : s.printPage].join(" ");
  const issuer = cert.issuer || (preview ? <span className={s.placeholder}>발급 기관</span> : null);
  const signer = cert.signer || (preview ? <span className={s.placeholder}>대표자</span> : null);
  // 상장 용지 모드: 여백·이동은 CSS 변수로 넘긴다(mm)
  const style =
    design === "paper" && paper
      ? ({
          "--pm": String(paper.margin),
          "--px": String(paper.shiftX),
          "--py": String(paper.shiftY),
        } as CSSProperties)
      : undefined;
  return (
    <article className={cls} data-font={font} data-design={design} data-color={color} style={style}>
      {design === "pattern" && <PatternBorder />}
      {design === "paper" && preview && <div className={s.paperArea} aria-hidden="true" />}
      <div className={s.frame}>
        <p className={s.number}>{cert.number}</p>
        <p className={s.title}>{cert.title}</p>
        {cert.rows.length > 0 && (
          <dl className={s.rows}>
            {cert.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className={s.body}>{cert.body}</p>
        <p className={s.date}>{cert.date}</p>
        <p className={s.issuer}>
          {issuer}
          {signer && <span className={s.signer}>{signer}</span>}
          {seal && (
            <span className={s.sealSpot}>
              {/* eslint-disable-next-line @next/next/no-img-element -- 사용자가 올린 이미지(데이터 주소)라 최적화 대상이 아님 */}
              <img
                className={s.seal}
                src={seal.src}
                alt=""
                style={{ width: `calc(${seal.size} * var(--mm))`, height: `calc(${seal.size} * var(--mm))` }}
              />
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
