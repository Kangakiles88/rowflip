import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 백엔드가 없는 도구라 정적 HTML로 내보낸다 (out/ 폴더를 어떤 호스팅에든 올리면 됨).
  output: "export",
};

export default nextConfig;
