// IndexNow 자동 전송 — 배포할 때 새로 생기거나 내용이 바뀐(또는 사라진) 주소만 네이버·빙에 알린다.
// IndexNow: 주소 목록을 보내면 검색엔진이 바로 다시 수집하러 오는 공개 규약. 한 곳(api.indexnow.org)에
// 보내면 참여 검색엔진(네이버·빙 등)이 서로 공유한다. 구글은 참여하지 않는다(사이트맵 + 서치 콘솔).
//
// Cloudflare 배포 명령(Deploy command):
//   node scripts/indexnow.mjs prepare && npx wrangler deploy && node scripts/indexnow.mjs submit
//   prepare  배포 전: 지금 공개된 사이트(옛 판)와 방금 빌드한 out/(새 판)을 페이지마다 비교 → .indexnow-pending.json
//   submit   배포 후: 그 목록을 전송하고 파일을 지움
// 비교는 화면 글자(제목·설명·본문)로 한다. HTML에는 빌드마다 바뀌는 파일 이름·스크립트가 섞여 있어서
// 그대로 비교하면 매번 모든 주소가 바뀐 것으로 나온다. 사이트맵 lastmod도 도구 페이지는 빌드 날짜라 쓰지 않는다.
//
// 어떤 오류가 나도 종료 코드는 0 — 알림 실패가 배포를 막으면 안 된다.
// 옛 판을 못 읽으면(사이트 다운·첫 배포) 아무것도 보내지 않는다(전체를 다시 보내는 것보다 안전).
//
// 시험: node scripts/indexnow.mjs prepare --live http://localhost:4310 / node scripts/indexnow.mjs submit --dry-run

import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://rowflip.com";
/** public/<KEY>.txt 에 같은 값이 들어 있어야 한다(검색엔진이 이 파일로 소유자 확인) */
const KEY = "27a08147023f31f48e9b4c7b3e3dca02";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const OUT = "out";
const PENDING = ".indexnow-pending.json";
const MAX_URLS = 10000; // 규약상 한 번에 보낼 수 있는 최대 개수

const args = process.argv.slice(2);
const mode = args[0];
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const dryRun = args.includes("--dry-run");
const liveBase = (opt("--live") ?? SITE).replace(/\/$/, "");

const log = (msg) => console.log(`[indexnow] ${msg}`);

/** sitemap.xml → 경로 목록('/estimate/' 같은 형태) */
export function sitemapPaths(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}

/** HTML → 비교용 글자: title + meta description + 본문 글자(스크립트·스타일 제외) */
export function pageText(html) {
  const desc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i)?.[1] ?? "";
  const body = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");
  return decode(`${desc}\n${body}`).replace(/\s+/g, " ").trim();
}

function builtHtml(path) {
  const file = join(OUT, path.replace(/^\//, ""), "index.html");
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "rowflip-indexnow-check" }, redirect: "follow" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

/** 새 판 주소 중 옛 판에 없거나 글자가 다른 것 + 옛 판에만 있던(사라진) 주소 */
export function changedPaths(newPaths, oldPaths, newText, oldText) {
  const oldSet = new Set(oldPaths);
  const newSet = new Set(newPaths);
  const changed = newPaths.filter((p) => !oldSet.has(p) || newText(p) !== oldText(p));
  const removed = oldPaths.filter((p) => !newSet.has(p));
  return { changed, removed };
}

async function prepare() {
  rmSync(PENDING, { force: true });
  const newXml = readFileSync(join(OUT, "sitemap.xml"), "utf8");
  const newPaths = sitemapPaths(newXml);

  let oldXml;
  try {
    oldXml = await fetchText(`${liveBase}/sitemap.xml`);
  } catch (e) {
    log(`공개된 사이트맵을 읽지 못해 이번에는 보내지 않습니다: ${e.message}`);
    return;
  }
  if (!oldXml) {
    log("공개된 사이트맵이 없어(첫 배포) 이번에는 보내지 않습니다.");
    return;
  }
  const oldPaths = sitemapPaths(oldXml);

  // 옛 판 페이지 글자를 모은다 — 새 판에도 있는 주소만 비교하면 된다
  const oldTexts = new Map();
  const both = newPaths.filter((p) => oldPaths.includes(p));
  let failed = 0;
  for (let i = 0; i < both.length; i += 6) {
    await Promise.all(
      both.slice(i, i + 6).map(async (p) => {
        try {
          const html = await fetchText(`${liveBase}${p}`);
          oldTexts.set(p, html ? pageText(html) : null);
        } catch {
          failed++;
          oldTexts.set(p, undefined); // 못 읽은 페이지는 바뀌지 않은 것으로 본다
        }
      }),
    );
  }

  const newText = (p) => {
    const html = builtHtml(p);
    return html ? pageText(html) : null;
  };
  const oldText = (p) => oldTexts.get(p);
  const { changed, removed } = changedPaths(
    newPaths,
    oldPaths,
    newText,
    (p) => (oldText(p) === undefined ? newText(p) : oldText(p)),
  );

  const urls = [...changed, ...removed].map((p) => `${SITE}${p}`);
  if (failed) log(`옛 판을 읽지 못한 페이지 ${failed}개는 건너뜀`);
  log(`비교 ${newPaths.length}개 → 새로 생김·바뀜 ${changed.length}개, 사라짐 ${removed.length}개`);
  for (const u of urls) log(`  ${u}`);
  if (urls.length) writeFileSync(PENDING, JSON.stringify(urls.slice(0, MAX_URLS), null, 2));
}

async function submit() {
  if (!existsSync(PENDING)) {
    log("보낼 주소가 없습니다.");
    return;
  }
  const urlList = JSON.parse(readFileSync(PENDING, "utf8"));
  const body = { host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList };
  if (dryRun) {
    log(`(시험) ${urlList.length}개를 보낼 예정:\n${JSON.stringify(body, null, 2)}`);
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  // 200 = 받음, 202 = 받음(키 확인은 나중에). 그 밖은 실패
  log(`${urlList.length}개 전송 → HTTP ${res.status}${res.ok ? "" : ` ${await res.text().catch(() => "")}`}`);
  rmSync(PENDING, { force: true });
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (isMain) {
  try {
    if (mode === "prepare") await prepare();
    else if (mode === "submit") await submit();
    else log("사용법: node scripts/indexnow.mjs prepare|submit [--live 주소] [--dry-run]");
  } catch (e) {
    log(`오류(배포는 계속): ${e instanceof Error ? e.message : e}`);
  }
  process.exit(0);
}
