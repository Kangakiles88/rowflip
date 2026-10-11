import type { Certificate } from "@/utils/certificate";
import s from "./certificate.module.css";

interface Props {
  cert: Certificate;
  font: "serif" | "sans";
  /** 미리보기면 칸 너비에 맞춰 줄이고, 빈 발급 기관 자리에 안내를 보여 준다 */
  preview?: boolean;
}

/** 상장·수료증 한 장(A4 세로) */
export function CertificatePage({ cert, font, preview = false }: Props) {
  const cls = [s.page, preview ? s.preview : s.printPage].join(" ");
  const issuer = cert.issuer || (preview ? <span className={s.placeholder}>발급 기관</span> : null);
  const signer = cert.signer || (preview ? <span className={s.placeholder}>대표자</span> : null);
  return (
    <article className={cls} data-font={font}>
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
        </p>
      </div>
    </article>
  );
}
