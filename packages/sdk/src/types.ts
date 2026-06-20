export interface Holder {
  userId: bigint;
  balance: bigint;
}

export interface SumNode {
  hash: bigint;
  sum: bigint;
}

export interface InclusionProof {
  index: number;
  userId: bigint;
  balance: bigint;
  leafHash: bigint;
  siblings: SumNode[];
  pathBits: number[];
  root: bigint;
  total: bigint;
}

export interface CircuitInput {
  balances: string[];
  userIds: string[];
}
