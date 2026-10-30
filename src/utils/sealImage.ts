/**
 * 직인 이미지 — 흰 배경을 투명하게 바꾼다(스캔·사진 도장의 흰 바탕 제거).
 * 이미지는 브라우저 안에서만 쓰고 서버로 보내거나 저장하지 않는다.
 */

/**
 * RGBA 픽셀 배열에서 밝은(흰색에 가까운) 픽셀을 투명하게 만든다. 제자리에서 바꾼다.
 * 경계는 부드럽게: threshold보다 밝으면 완전 투명, soft 구간은 밝기에 따라 반투명.
 */
export function whiteToTransparent(data: Uint8ClampedArray, threshold = 235, soft = 40): Uint8ClampedArray {
  for (let i = 0; i < data.length; i += 4) {
    const light = Math.min(data[i], data[i + 1], data[i + 2]);
    if (light >= threshold) data[i + 3] = 0;
    else if (light > threshold - soft) {
      const keep = (threshold - light) / soft; // 0(흰색 쪽) ~ 1(진한 쪽)
      data[i + 3] = Math.round(data[i + 3] * keep);
    }
  }
  return data;
}

/** 파일 → 흰 배경을 지운 PNG 데이터 주소. 긴 변을 maxSide 픽셀로 줄인다 */
export async function loadSealImage(file: File, maxSide = 600): Promise<string> {
  return loadImageFile(file, { maxSide, clearWhite: true });
}

/** 회사 로고 — 색이 흰색인 부분이 있을 수 있어 배경은 그대로 두고 크기만 줄인다 */
export async function loadLogoImage(file: File, maxSide = 800): Promise<string> {
  return loadImageFile(file, { maxSide, clearWhite: false });
}

async function loadImageFile(file: File, { maxSide, clearWhite }: { maxSide: number; clearWhite: boolean }): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지를 처리하지 못했습니다.");
    ctx.drawImage(img, 0, 0, w, h);
    if (clearWhite) {
      const pixels = ctx.getImageData(0, 0, w, h);
      whiteToTransparent(pixels.data);
      ctx.putImageData(pixels, 0, 0);
    }
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
