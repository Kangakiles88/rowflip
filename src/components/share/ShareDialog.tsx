"use client";

import { useEffect, useRef, useState } from "react";
import { shareConfig } from "@/config/share";
import { copyText } from "@/utils/clipboard";
import { trackShare, type ShareChannel } from "@/utils/tracking";
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

  type Brand = keyof typeof shareConfig.icons;
  const links: { channel: Brand; label: string; mark: string; href: string }[] = [
    { channel: "naver", label: "네이버", mark: "네", href: `https://share.naver.com/web/shareView?url=${enc(url)}&title=${enc(text)}` },
    { channel: "band", label: "밴드", mark: "밴", href: `https://band.us/plugin/share?body=${enc(`${text}\n${url}`)}&route=${enc(url)}` },
    { channel: "facebook", label: "페이스북", mark: "페", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { channel: "x", label: "X", mark: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
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

  const brandMark = (brand: Brand, mark: string) =>
    shareConfig.icons[brand] ? (
      // eslint-disable-next-line @next/next/no-img-element -- 운영자가 넣는 정적 아이콘
      <img src={shareConfig.icons[brand]} alt="" className={styles.brandImg} />
    ) : (
      <span className={styles.mark}>{mark}</span>
    );

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
            {phase === "done" && <span className={styles.check} aria-hidden="true" />}
            {phase === "loading" ? shareConfig.loadingText : shareConfig.doneTitle}
            <span className={styles.summary}>{summary}</span>
          </p>
          <button type="button" className={styles.x} aria-label="닫기" onClick={() => ref.current?.close()}>
            <Icon name="close" />
          </button>
        </div>
        <div className={styles.progress} data-done={phase === "done" || undefined} aria-hidden="true">
          <span style={{ animationDuration: `${shareConfig.loadingMs}ms` }} />
        </div>

        <section className={styles.shareSection} aria-labelledby="share-heading">
          <p id="share-heading" className={styles.sectionTitle}>
            <Icon name="people" />
            지인에게 알리기
          </p>
          <div className={styles.message}>
            {shareConfig.message.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <ul className={styles.targets} style={{ "--n": itemCount, "--n-narrow": itemCount <= 4 ? itemCount : Math.ceil(itemCount / 2) } as React.CSSProperties}>
          <li>
            <button type="button" className={styles.target} onClick={copyLink}>
              <span className={styles.circle} data-done={copied || undefined}>
                <Icon name={copied ? "check" : "link"} />
              </span>
              <span className={styles.label}>{copied ? "복사됨" : "링크 복사"}</span>
            </button>
          </li>
          {kakao && (
            <li>
              <button type="button" className={styles.target} onClick={kakaoShare}>
                <span className={styles.circle}>{brandMark("kakao", "카")}</span>
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
                <span className={styles.circle}>{brandMark(l.channel, l.mark)}</span>
                <span className={styles.label}>{l.label}</span>
              </a>
            </li>
          ))}
          {canNativeShare && (
            <li>
              <button type="button" className={styles.target} onClick={nativeShare}>
                <span className={styles.circle}>
                  <Icon name="share" />
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

/** 일반 기능 아이콘 (브랜드 로고 아님) */
function Icon({ name }: { name: "link" | "check" | "share" | "close" | "people" }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "link":
      return (
        <svg {...common}>
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.1 1.1" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.1-1.1" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      );
    case "share":
      return (
        <svg {...common}>
          <path d="M12 15V3.5" />
          <path d="M7.5 8L12 3.5 16.5 8" />
          <path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5" />
        </svg>
      );
    case "close":
      return (
        <svg {...common} width={18} height={18}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "people":
      return (
        <svg {...common} width={16} height={16}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16 14.2a4.4 4.4 0 0 1 4.8 4.8" />
        </svg>
      );
  }
}
