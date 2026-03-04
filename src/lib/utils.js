import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** EUR → HUF: multiply by 395, round up to nearest 100 */
export function eurToHuf(eurPrice) {
  return Math.ceil((eurPrice * 395) / 100) * 100
}

/** Format a price for display based on currency */
export function formatPrice(eurPrice, currency = 'EUR') {
  if (currency === 'EUR') {
    return `€${Number(eurPrice).toFixed(2)}`
  }
  const huf = eurToHuf(eurPrice)
  return `${huf.toLocaleString('hu-HU')} Ft`
}

/** Generate a ZR order number */
export function generateOrderNumber() {
  return `ZR-${Date.now().toString(36).toUpperCase()}`
}
