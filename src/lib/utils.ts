import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 바코드/번호에서 공백, 하이픈 등 비숫자 문자를 제거하여 순수 숫자열로 정규화 */
export function normalizeBarcode(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}
