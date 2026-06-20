export function fmtAmount(v: string | bigint | null | undefined): string {
  if (v === null || v === undefined) return "—";
  try {
    return BigInt(v).toLocaleString("en-US");
  } catch {
    return String(v);
  }
}

export function shortHash(hex: string | null | undefined, n = 6): string {
  if (!hex) return "—";
  return hex.length <= n * 2 ? hex : `${hex.slice(0, n)}…${hex.slice(-n)}`;
}

const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER ?? "https://stellar.expert/explorer/testnet";

export function explorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function explorerContract(id: string): string {
  return `${EXPLORER}/contract/${id}`;
}
