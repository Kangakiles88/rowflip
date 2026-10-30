import type { Metadata } from "next";
import Link from "next/link";
import "./pretendard.css";
import "./globals.css";

/** 없는 주소(out/404.html) — 루트 레이아웃이 한국어·영어로 나뉘어 있어 404는 따로 만든다 */
export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 | RowFlip",
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <html lang="ko">
      <body>
        <main className="container page">
          <div className="intro">
            <div className="introHead">
              <h1>페이지를 찾을 수 없습니다</h1>
            </div>
            <p className="lede">
              주소가 바뀌었거나 없는 페이지입니다. <Link className="inlineLink" href="/">RowFlip 첫 페이지</Link>로 이동하세요.
              {" "}
              <span lang="en">
                Page not found. Go to the <Link className="inlineLink" href="/en/">English page</Link>.
              </span>
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
