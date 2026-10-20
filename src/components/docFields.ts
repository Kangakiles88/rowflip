import type { VatMode } from "@/utils/estimate";
import type { Supplier } from "./EstimateDoc";

/** 견적서·거래명세서가 함께 쓰는 입력칸·선택지 */

export const VAT_CHOICES: { value: VatMode; label: string }[] = [
  { value: "exclusive", label: "부가세 별도" },
  { value: "inclusive", label: "부가세 포함" },
  { value: "none", label: "없음(면세)" },
];

export const VAT_HINT: Record<VatMode, string> = {
  exclusive: "단가는 공급가액입니다. 세액 10%를 따로 더합니다(원 미만 버림).",
  inclusive: "단가에 부가세가 들어 있습니다. 금액을 공급가액(÷1.1)과 세액으로 나눕니다.",
  none: "면세 품목이나 간이과세자처럼 세액을 따로 적지 않을 때 고르세요.",
};

export const EMPTY_PARTY: Supplier = { bizNo: "", name: "", ceo: "", address: "", bizType: "", bizItem: "", phone: "" };

export const SAMPLE_SUPPLIER: Supplier = {
  bizNo: "123-45-67890",
  name: "한빛오피스",
  ceo: "이서준",
  address: "서울특별시 중구 세종대로 110, 3층",
  bizType: "도소매",
  bizItem: "사무용품",
  phone: "02-1234-5678",
};

export const PARTY_FIELDS: { key: keyof Supplier; label: string; placeholder: string }[] = [
  { key: "name", label: "상호", placeholder: "예: 한빛오피스" },
  { key: "ceo", label: "대표자", placeholder: "예: 이서준" },
  { key: "bizNo", label: "등록번호", placeholder: "000-00-00000" },
  { key: "address", label: "주소", placeholder: "사업장 주소" },
  { key: "bizType", label: "업태", placeholder: "예: 도소매" },
  { key: "bizItem", label: "종목", placeholder: "예: 사무용품" },
  { key: "phone", label: "연락처", placeholder: "예: 02-1234-5678" },
];

/** 브라우저 기준 오늘 → 'YYYY-MM-DD' */
export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
