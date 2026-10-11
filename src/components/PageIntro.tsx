import type { ReactNode } from "react";
import styles from "./tool.module.css";

/** 페이지 제목(H1) + 개인정보 안내 + 한두 줄 설명 */
export function PageIntro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="intro">
      <div className="introHead">
        <h1>{title}</h1>
        <p className={styles.privacy}>
          <span className={styles.privacyDot} aria-hidden="true" />
          입력한 데이터는 서버로 전송되지 않습니다
        </p>
      </div>
      <p className="lede">{children}</p>
    </div>
  );
}
