"use client";

import { useEffect, useRef, useState } from "react";
import { shareConfig } from "@/config/share";
import { siteConfig } from "@/config/site";
import { copyText } from "@/utils/clipboard";
import { withShareUtm } from "@/utils/shareUrl";
import { trackShare, type ShareChannel } from "@/utils/tracking";
import { ShareIcon, type ShareIconName } from "./ShareIcons";
import styles from "./share.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
  /** 공유할 페이지 경로 — "/" 또는 "/transpose/" */
  path: string;
  /** 로딩·완료 줄에 붙는 요약 (예: "6개 항목") */
  summary: string;
}

interface KakaoSdk {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendScrap: (o: { requestUrl: string }) => void };
}

let kakaoLoading: Promise<KakaoSdk | null> | null = null;

/** 카카오 SDK는 팝업이 열릴 때만 불러온다 */
function loadKakao(): Promise<KakaoSdk | null> {
  const { jsKey, sdkUrl, sdkIntegrity } = shareConfig.kakao;
  if (!jsKey) return Promise.resolve(null);
  if (kakaoLoading) return kakaoLoading;
  kakaoLoading = new Promise((resolve) => {
    const ready = () => {
      const k = (window as unknown as { Kakao?: KakaoSdk }).Kakao;
      if (!k) return resolve(null);
      try {
        if (!k.isInitialized()) k.init(jsKey);
        resolve(k);
      } catch {
        resolve(null);
      }
    };
    if ((window as unknown as { Kakao?: KakaoSdk }).Kakao) return ready();
    const s = document.createElement("script");
    s.src = sdkUrl;
    s.async = true;
    if (sdkIntegrity) {
      s.integrity = sdkIntegrity;
      s.crossOrigin = "anonymous";
    }
    s.onload = ready;
    s.onerror = () => {
      kakaoLoading = null;
      resolve(null);
    };
    document.head.appendChild(s);
  });
  return kakaoLoading;
}


export function ShareDialog({ open, onClose, path, summary }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"loading" | "done">("loading");
  /** 문구가 한 번 다 흘러갈 때까지 걸리는 시간(ms) — 전광판이 실제 너비를 재서 알려 준다 */
  const [readMs, setReadMs] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);
  const [notice, setNotice] = useState("");
  const [kakao, setKakao] = useState<KakaoSdk | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // 열기·닫기
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setPhase("loading");
      setReadMs(null);
      setRemaining(null);
      setRunId((n) => n + 1);
      setNotice("");
      setCopied(false);
      // www나 미리보기 주소로 들어와도 대표 주소로 공유한다 — 카카오에는 rowflip.com 하나만 등록하면 되고 검색 점수도 한 주소로 모인다
      setUrl(`${siteConfig.url}${path}`);
      setCanNativeShare(typeof navigator.share === "function");
      d.showModal();
      void loadKakao().then(setKakao);
    }
    if (!open && d.open) d.close();
  }, [open, path]);

  // 남은 시간 표시 → 0초가 되면 닫기 버튼이 나타난다
  useEffect(() => {
    if (!open || readMs === null) return;
    const end = performance.now() + readMs;
    const tick = () => {
      const left = Math.max(0, end - performance.now());
      setRemaining(Math.ceil(left / 1000));
      if (left === 0) setPhase("done");
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [open, readMs, runId]);

  useEffect(() => {
    if (phase === "done") closeRef.current?.focus();
  }, [phase]);

  const canClose = phase === "done";
  const close = () => {
    if (canClose) ref.current?.close();
  };

  const text = shareConfig.shareText;
  const enc = encodeURIComponent;
  const page = path;
  const track = (channel: ShareChannel) => trackShare({ channel, page });
  /** 채널마다 UTM 꼬리표를 붙인 주소 — 공유로 들어온 방문을 GA4에서 채널별로 볼 수 있다 */
  const u = (channel: ShareChannel) => (url ? withShareUtm(url, channel) : "");

  const links: { channel: ShareChannel & ShareIconName; label: string; href: string }[] = [
    { channel: "naver", label: "네이버", href: `https://share.naver.com/web/shareView?url=${enc(u("naver"))}&title=${enc(text)}` },
    { channel: "band", label: "밴드", href: `https://band.us/plugin/share?body=${enc(`${text}\n${u("band")}`)}&route=${enc(url)}` },
    { channel: "facebook", label: "페이스북", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(u("facebook"))}` },
    { channel: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(u("x"))}` },
  ];

  const copyLink = async () => {
    track("copy");
    const ok = await copyText(u("copy"));
    if (ok) {
      setCopied(true);
      setNotice("링크를 복사했습니다. 메신저에 붙여넣어 보내 주세요.");
      setTimeout(() => setCopied(false), 1800);
    } else {
      setNotice(`복사하지 못했습니다. 주소: ${u("copy")}`);
    }
  };

  const nativeShare = async () => {
    track("native");
    try {
      await navigator.share({ title: document.title, text, url: u("native") });
    } catch {
      /* 사용자가 취소했거나 지원하지 않음 */
    }
  };

  const kakaoShare = () => {
    track("kakao");
    try {
      kakao?.Share.sendScrap({ requestUrl: u("kakao") });
    } catch {
      setNotice("카카오톡 공유를 열지 못했습니다. 링크 복사를 이용해 주세요.");
    }
  };

  const itemCount = 1 + (kakao ? 1 : 0) + links.length + (canNativeShare ? 1 : 0);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="share-title"
      aria-busy={phase === "loading"}
      onClose={onClose}
      onCancel={(e) => {
        // 문구가 끝나기 전에는 Esc 로 닫히지 않게
        if (!canClose) e.preventDefault();
      }}
      onClick={(e) => {
        // 바깥(배경)을 누르면 닫기 — 문구가 끝난 뒤에만
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <p id="share-title" className={styles.title}>
            {canClose ? (
              <span className={styles.check} aria-hidden="true" />
            ) : (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            {canClose ? shareConfig.doneTitle : shareConfig.loadingText}
            <span className={styles.summary}>{summary}</span>
          </p>
          {canClose ? (
            <button type="button" className={styles.x} aria-label="닫기" onClick={close}>
              <ShareIcon name="close" size={18} />
            </button>
          ) : (
            <span className={styles.countdown} aria-live="off">
              {remaining ?? "–"}초
            </span>
          )}
        </div>

        <Ticker key={runId} lines={shareConfig.message} active={open} onMeasured={setReadMs} />
        <div className={styles.progress} data-done={canClose || undefined} aria-hidden="true">
          {readMs !== null && <span key={runId} style={{ animationDuration: `${readMs}ms` }} />}
        </div>

        <p className={styles.sectionTitle}>{shareConfig.sectionTitle}</p>
        <ul
          className={styles.targets}
          aria-label="공유하기"
          style={{ "--n": itemCount, "--n-narrow": itemCount <= 4 ? itemCount : Math.ceil(itemCount / 2) } as React.CSSProperties}
        >
          <li>
            <button type="button" className={styles.target} onClick={copyLink}>
              <span className={styles.circle} data-done={copied || undefined}>
                <ShareIcon name={copied ? "check" : "link"} />
              </span>
              <span className={styles.label}>{copied ? "복사됨" : "링크 복사"}</span>
            </button>
          </li>
          {kakao && (
            <li>
              <button type="button" className={styles.target} onClick={kakaoShare}>
                <span className={styles.circle}>
                  <ShareIcon name="kakao" />
                </span>
                <span className={styles.label}>카카오톡</span>
              </button>
            </li>
          )}
          {links.map((l) => (
            <li key={l.channel}>
              <a
                className={styles.target}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(l.channel)}
              >
                <span className={styles.circle}>
                  <ShareIcon name={l.channel} />
                </span>
                <span className={styles.label}>{l.label}</span>
              </a>
            </li>
          ))}
          {canNativeShare && (
            <li>
              <button type="button" className={styles.target} onClick={nativeShare}>
                <span className={styles.circle}>
                  <ShareIcon name="share" />
                </span>
                <span className={styles.label}>다른 앱</span>
              </button>
            </li>
          )}
        </ul>
        <p className={styles.notice} aria-live="polite">
          {notice}
        </p>

        <div className={styles.footer}>
          <p className={styles.footnote}>{shareConfig.footnote}</p>
          {canClose ? (
            <button ref={closeRef} type="button" className={styles.close} onClick={close}>
              {shareConfig.closeLabel}
            </button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

/**
 * 전광판처럼 오른쪽 끝에서 들어와 왼쪽으로 흘러가는 안내 문구.
 * 실제 글자 너비를 재서 속도를 일정하게 맞추고,
 * "마지막 글자가 들어와 화면 가운데쯤까지 온 시점"을 다 읽은 시간으로 부모에게 알려 준다.
 * 움직임 줄이기 설정 사용자에게는 멈춘 문단을 보여 주고 글자 수로 읽는 시간을 잡는다.
 */
function Ticker({
  lines,
  active,
  onMeasured,
}: {
  lines: readonly string[];
  active: boolean;
  onMeasured: (ms: number) => void;
}) {
  const windowRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLSpanElement>(null);
  const [motion, setMotion] = useState<{ from: number; to: number; ms: number } | null>(null);
  const text = lines.join(" ");

  useEffect(() => {
    if (!active) return;
    // 대화상자가 화면에 그려진 다음 프레임에 잰다
    const id = requestAnimationFrame(() => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const win = windowRef.current?.clientWidth ?? 0;
      const run = runRef.current?.scrollWidth ?? 0;
      if (reduce || win === 0 || run === 0) {
        onMeasured(Math.max(shareConfig.loadingMs, text.length * shareConfig.readMsPerChar));
        return;
      }
      const speed = shareConfig.tickerSpeed; // px/초
      setMotion({ from: win, to: -run, ms: ((win + run) / speed) * 1000 });
      onMeasured(((run + win * 0.5) / speed) * 1000);
    });
    return () => cancelAnimationFrame(id);
  }, [active, onMeasured, text]);

  return (
    <div className={styles.ticker}>
      <p className={styles.tickerStatic}>{text}</p>
      <div className={styles.tickerWindow} ref={windowRef} aria-hidden="true">
        <div
          className={styles.tickerTrack}
          data-running={motion ? "" : undefined}
          style={
            motion
              ? ({
                  "--ticker-from": `${motion.from}px`,
                  "--ticker-to": `${motion.to}px`,
                  "--ticker-duration": `${motion.ms}ms`,
                } as React.CSSProperties)
              : undefined
          }
        >
          <span className={styles.tickerRun} ref={runRef}>
            {lines.map((line, i) => (
              <span key={i} className={styles.tickerItem}>
                {line}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
