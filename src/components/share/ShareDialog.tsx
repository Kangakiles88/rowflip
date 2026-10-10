"use client";

import { useEffect, useRef, useState } from "react";
import { shareConfig } from "@/config/share";
import { copyText } from "@/utils/clipboard";
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
  const [notice, setNotice] = useState("");
  const [kakao, setKakao] = useState<KakaoSdk | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setPhase("loading");
      setNotice("");
      setCopied(false);
      setUrl(`${window.location.origin}${path}`);
      setCanNativeShare(typeof navigator.share === "function");
      d.showModal();
      void loadKakao().then(setKakao);
      const t = setTimeout(() => setPhase("done"), shareConfig.loadingMs);
      return () => clearTimeout(t);
    }
    if (!open && d.open) d.close();
  }, [open, path]);

  useEffect(() => {
    if (phase === "done") closeRef.current?.focus();
  }, [phase]);

  const text = shareConfig.shareText;
  const enc = encodeURIComponent;
  const page = path;
  const track = (channel: ShareChannel) => trackShare({ channel, page });

  const links: { channel: ShareChannel & ShareIconName; label: string; href: string }[] = [
    { channel: "naver", label: "네이버", href: `https://share.naver.com/web/shareView?url=${enc(url)}&title=${enc(text)}` },
    { channel: "band", label: "밴드", href: `https://band.us/plugin/share?body=${enc(`${text}\n${url}`)}&route=${enc(url)}` },
    { channel: "facebook", label: "페이스북", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { channel: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ];

  const copyLink = async () => {
    track("copy");
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      setNotice("링크를 복사했습니다. 메신저에 붙여넣어 보내 주세요.");
      setTimeout(() => setCopied(false), 1800);
    } else {
      setNotice(`복사하지 못했습니다. 주소: ${url}`);
    }
  };

  const nativeShare = async () => {
    track("native");
    try {
      await navigator.share({ title: document.title, text, url });
    } catch {
      /* 사용자가 취소했거나 지원하지 않음 */
    }
  };

  const kakaoShare = () => {
    track("kakao");
    try {
      kakao?.Share.sendScrap({ requestUrl: url });
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
      onClick={(e) => {
        // 바깥(배경)을 누르면 닫기
        if (e.target === e.currentTarget) ref.current?.close();
      }}
    >
      <div className={styles.body}>
        <div className={styles.head}>
          <p id="share-title" className={styles.title}>
            {phase === "done" ? (
              <span className={styles.check} aria-hidden="true" />
            ) : (
              <span className={styles.spinner} aria-hidden="true" />
            )}
            {phase === "loading" ? shareConfig.loadingText : shareConfig.doneTitle}
            <span className={styles.summary}>{summary}</span>
          </p>
          <button type="button" className={styles.x} aria-label="닫기" onClick={() => ref.current?.close()}>
            <ShareIcon name="close" size={18} />
          </button>
        </div>

        <Ticker lines={shareConfig.message} />
        <div className={styles.progress} data-done={phase === "done" || undefined} aria-hidden="true">
          <span style={{ animationDuration: `${shareConfig.loadingMs}ms` }} />
        </div>

        <p className={styles.sectionTitle}>지인에게 알리기</p>
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
          <button ref={closeRef} type="button" className={styles.close} onClick={() => ref.current?.close()}>
            {shareConfig.closeLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * 전광판처럼 오른쪽에서 왼쪽으로 흐르는 안내 문구.
 * 같은 문구를 두 벌 이어 붙여 끊김 없이 돌고, 화면 낭독기는 숨겨 둔 정지 문구를 읽는다.
 * 움직임 줄이기 설정을 켠 사용자에게는 멈춘 문단으로 보여 준다.
 */
function Ticker({ lines }: { lines: readonly string[] }) {
  const text = lines.join(" ");
  // 글자 수에 비례해 속도를 일정하게 유지 (대략 초당 7~8자)
  const duration = `${Math.max(12, Math.round(text.length * 0.14))}s`;
  return (
    <div className={styles.ticker}>
      <p className={styles.tickerStatic}>{text}</p>
      <div className={styles.tickerWindow} aria-hidden="true">
        <div className={styles.tickerTrack} style={{ "--ticker-duration": duration } as React.CSSProperties}>
          {[0, 1].map((copy) => (
            <span key={copy} className={styles.tickerRun}>
              {lines.map((line, i) => (
                <span key={i} className={styles.tickerItem}>
                  {line}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
