// Pretendard 글꼴을 우리 사이트에서 직접 내보낸다(외부 CDN을 기다리느라 첫 화면이 늦어지는 문제 해결).
// - woff2 조각 92개 → public/fonts/pretendard/ (빌드 전에 복사, 저장소에는 넣지 않음)
// - @font-face CSS → src/app/pretendard.css (주소를 /fonts/pretendard/ 로 바꿔 globals.css와 함께 묶음)
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules/pretendard/dist/web/variable");
const outFonts = join(root, "public/fonts/pretendard");

mkdirSync(outFonts, { recursive: true });
cpSync(join(src, "woff2-dynamic-subset"), outFonts, { recursive: true });

const css = readFileSync(join(src, "pretendardvariable-dynamic-subset.css"), "utf8")
  .replace(/url\(\.\/woff2-dynamic-subset\//g, "url(/fonts/pretendard/")
  // 첫 방문에서 글꼴이 늦게 오면 기본 글꼴로 그대로 보여 주고, 화면이 다시 밀리지 않게 한다(CLS 방지).
  // 한 번 받은 글꼴은 캐시돼 다음 페이지부터 바로 Pretendard로 보인다.
  .replace(/font-display:\s*swap/g, "font-display: optional");

writeFileSync(join(root, "src/app/pretendard.css"), css);
console.log("Pretendard 글꼴 복사 완료");
