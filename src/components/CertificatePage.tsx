import type { CSSProperties } from "react";
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

/**
 * 뇌문(雷紋·회문) 테두리 — 1단위 = 1mm(viewBox 210×297), 색은 currentColor(CSS 토큰).
 * 칸 하나는 5×5 격자: 안쪽 선(b=4.5)에서 올라와 안으로 감기는 갈고리.
 * 선과 선 사이가 모두 한 격자로 같아서 띠 전체가 이어진 무늬로 보인다.
 */
const HOOK: ReadonlyArray<readonly [number, number]> = [
  [4.5, 4.5],
  [4.5, 0.5],
  [0.5, 0.5],
  [0.5, 3.5],
  [3.5, 3.5],
  [3.5, 1.5],
  [1.5, 1.5],
  [1.5, 2.5],
  [2.5, 2.5],
];

function PatternBorder() {
  const W = 210;
  const H = 297;
  const O = 9; // 바깥 굵은 선 위치(mm)
  const g = 1.3; // 격자 한 칸(mm)
  const pos = (b: number) => O + (b + 1.7) * g; // 종이 가장자리에서 b 격자 위치
  const p45 = pos(4.5);
  // 모서리 상자 사이 길이를 칸 수로 나눠 칸 너비를 살짝 맞춘다 — 모서리에서 무늬가 잘리지 않게
  const fit = (len: number) => {
    const n = Math.max(1, Math.round((len / g - 1) / 5));
    return { n, s: len / (5 * n + 1) };
  };
  const hz = fit(W - 2 * p45);
  const vt = fit(H - 2 * p45);
  const f = (v: number) => Math.round(v * 100) / 100;
  // 변마다 (따라가는 방향 a, 안쪽 방향 b) → 종이 좌표. 시계 방향으로 돌아 네 변 무늬 방향이 같다
  const sides: Array<{ n: number; map: (a: number, b: number) => [number, number] }> = [
    { n: hz.n, map: (a, b) => [p45 + (a + 0.5) * hz.s, pos(b)] },
    { n: vt.n, map: (a, b) => [W - pos(b), p45 + (a + 0.5) * vt.s] },
    { n: hz.n, map: (a, b) => [W - p45 - (a + 0.5) * hz.s, H - pos(b)] },
    { n: vt.n, map: (a, b) => [pos(b), H - p45 - (a + 0.5) * vt.s] },
  ];
  let d = "";
  for (const side of sides) {
    for (let i = 0; i < side.n; i++) {
      HOOK.forEach(([a, b], k) => {
        const [x, y] = side.map(i * 5 + a, b);
        d += `${k === 0 ? "M" : "L"}${f(x)} ${f(y)}`;
      });
    }
  }
  const rect = (b: number, sw: number) => (
    <rect
      x={pos(b)}
      y={pos(b)}
      width={W - 2 * pos(b)}
      height={H - 2 * pos(b)}
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
    />
  );
  const hair = 0.42;
  // 네 모서리 — 겹사각(回)
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ].flatMap(([cx, cy]) =>
    [-0.5, 0.5, 1.5].map((b) => {
      const size = (4 - 2 * (b + 0.5)) * g;
      const x = cx ? W - pos(4.5 - (b + 0.5)) : pos(b);
      const y = cy ? H - pos(4.5 - (b + 0.5)) : pos(b);
      return <rect key={`${cx}${cy}${b}`} x={f(x)} y={f(y)} width={f(size + g)} height={f(size + g)} />;
    }),
  );
  return (
    <svg className={s.deco} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {rect(-1.7, 1)}
      {rect(-0.5, hair)}
      {rect(4.5, hair)}
      {rect(5.7, 0.3)}
      <g fill="none" stroke="currentColor" strokeWidth={hair}>
        {corners}
      </g>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={hair} strokeLinejoin="miter" strokeLinecap="square" />
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
