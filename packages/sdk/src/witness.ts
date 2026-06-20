import type { Holder, CircuitInput } from "./types.js";

export function buildCircuitInput(holders: Holder[], depth: number): CircuitInput {
  const capacity = 1 << depth;
  if (holders.length > capacity) {
    throw new Error(`too many holders: ${holders.length} > capacity ${capacity}`);
  }
  const balances: string[] = [];
  const userIds: string[] = [];
  for (let i = 0; i < capacity; i++) {
    const h = holders[i];
    balances.push((h ? h.balance : 0n).toString());
    userIds.push((h ? h.userId : 0n).toString());
  }
  return { balances, userIds };
}
