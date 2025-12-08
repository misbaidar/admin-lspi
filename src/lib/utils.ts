import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Fungsi sakti untuk menggabungkan class tailwind tanpa konflik
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}