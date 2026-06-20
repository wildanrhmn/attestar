import { buildPoseidon } from "circomlibjs";

type PoseidonFn = ((inputs: (bigint | number | string)[]) => unknown) & {
  F: { toObject: (x: unknown) => bigint };
};

let instance: PoseidonFn | null = null;

export async function getPoseidon(): Promise<PoseidonFn> {
  if (!instance) {
    instance = (await buildPoseidon()) as PoseidonFn;
  }
  return instance;
}

export async function poseidon(inputs: bigint[]): Promise<bigint> {
  const p = await getPoseidon();
  return p.F.toObject(p(inputs));
}
