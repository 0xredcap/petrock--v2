export function formatHbarWithUsd(hbar: number, hbarPriceUsd: number | null): string {
  if (hbarPriceUsd === null || hbarPriceUsd <= 0) {
    return `${hbar} HBAR`;
  }
  const usd = (hbar * hbarPriceUsd).toFixed(4);
  return `${hbar} HBAR ($${usd})`;
}
