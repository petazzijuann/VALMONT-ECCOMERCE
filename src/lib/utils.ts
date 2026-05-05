import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateMargin(salePrice: number, costPrice: number): number {
  if (costPrice === 0) return 0;
  return Math.round(((salePrice - costPrice) / salePrice) * 100);
}
