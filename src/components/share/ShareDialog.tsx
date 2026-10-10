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

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setPhase("loading");
      setNotice("");
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

  const links: { channel: ShareChannel; label: string; href: string }[] = [
    { channel: "naver", label: "네이버", href: `https://share.naver.com/web/shareView?url=${enc(url)}&title=${enc(text)}` },
    { channel: "band", label: "밴드", href: `https://band.us/plugin/share?body=${enc(`${text}\n${url}`)}&route=${enc(url)}` },
    { channel: "facebook", label: "페이스북", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { channel: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
  ];

  const copyLink = async () => {
    track("copy");
    const ok = await copyText(url);
    setNotice(ok ? "링크를 복사했습니다. 메신저나 메일에 붙여넣어 보내 주세요." : `복사하지 못했습니다. 주소: ${url}`);
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
        <div className={styles.statusRow}>
          {phase === "loading" ? (
            <p id="share-title" className={styles.title}>
              {shareConfig.loadingText}
              <span className={styles.summary}> · {summary}</span>
            </p>
          ) : (
            <p id="share-title" className={styles.title}>
              <span className={styles.check} aria-hidden="true" />
              {shareConfig.doneTitle}
              <span className={styles.summary}> · {summary}</span>
            </p>
          )}
        </div>
        <div className={styles.progress} data-done={phase === "done" || undefined} aria-hidden="true">
          <span style={{ animationDuration: `${shareConfig.loadingMs}ms` }} />
        </div>

        <div className={styles.message}>
          {shareConfig.message.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className={styles.shareGrid} aria-label="공유하기" role="group">
          {canNativeShare && (
            <button type="button" className={`${styles.shareBtn} ${styles.shareWide}`} onClick={nativeShare}>
              다른 앱으로 공유
            </button>
          )}
          {kakao && (
            <button type="button" className={`${styles.shareBtn} ${styles.kakao}`} onClick={kakaoShare}>
              카카오톡
            </button>
          )}
          {links.map((l) => (
            <a
              key={l.channel}
              className={styles.shareBtn}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track(l.channel)}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className={styles.linkRow}>
          <input className={styles.linkInput} value={url} readOnly aria-label="공유할 주소" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className={styles.copyBtn} onClick={copyLink}>
            링크 복사
          </button>
        </div>
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
