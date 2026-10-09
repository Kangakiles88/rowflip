import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백엔드가 없는 도구라 정적 HTML로 내보낸다 (out/ 폴더를 어떤 호스팅에든 올리면 됨).
  output: "export",
  // /transpose/ → out/transpose/index.html — 어떤 정적 호스팅에서도 주소가 그대로 열린다.
  trailingSlash: true,
};

export default nextConfig;
