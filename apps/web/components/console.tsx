"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash, ArrowClockwise, ShieldCheck, ArrowSquareOut } from "@phosphor-icons/react";
import {
  getState,
  publishAttestation,
  drainReserves,
  mintReserves,
  checkInclusion,
  type HolderInput,
} from "@/app/actions";
import { SolvencySeal } from "@/components/solvency-seal";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { fmtAmount, explorerTx } from "@/lib/format";

type Status = "solvent" | "insolvent" | "none";

const DEFAULT_HOLDERS: HolderInput[] = [
  { userId: "1", balance: "300000" },
  { userId: "2", balance: "200000" },
  { userId: "3", balance: "150000" },
  { userId: "4", balance: "120000" },
  { userId: "5", balance: "80000" },
];

export function Console({
  initialStatus,
  initialReserves,
  initialEpoch,
}: {
  initialStatus: Status;
  initialReserves: string;
  initialEpoch: string | null;
}) {
  const router = useRouter();
  const [holders, setHolders] = useState<HolderInput[]>(DEFAULT_HOLDERS);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [reserves, setReserves] = useState<string>(initialReserves);
  const [epoch, setEpoch] = useState<string | null>(initialEpoch);
  const [drainAmount, setDrainAmount] = useState("500000");
  const [tx, setTx] = useState<{ label: string; hash?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inclusion, setInclusion] = useState<{ index: number; ok: boolean; balance: string } | null>(
    null,
  );
  const [pending, start] = useTransition();
  const [stage, setStage] = useState<string | null>(null);

  const liabilities = holders.reduce((sum, h) => {
    try {
      return sum + (h.balance ? BigInt(h.balance) : 0n);
    } catch {
      return sum;
    }
  }, 0n);

  async function refresh() {
    const s = await getState();
    setStatus(s.solvent === true ? "solvent" : s.solvent === false ? "insolvent" : "none");
    setReserves(s.onchainReserves);
    setEpoch(s.epoch);
    router.refresh();
  }

  function run(label: string, fn: () => Promise<{ ok: boolean; hash?: string; error?: string }>) {
    setError(null);
    setTx(null);
    setStage(label);
    start(async () => {
      const r = await fn();
      if (!r.ok) {
        setError(r.error ?? "Transaction failed.");
        setStage(null);
        return;
      }
      setTx({ label, hash: r.hash });
      await refresh();
      setStage(null);
    });
  }

  const setHolder = (i: number, key: keyof HolderInput, value: string) =>
    setHolders((hs) => hs.map((h, j) => (j === i ? { ...h, [key]: value } : h)));
  const addHolder = () =>
    setHolders((hs) => (hs.length >= 16 ? hs : [...hs, { userId: String(hs.length + 1), balance: "0" }]));
  const removeHolder = (i: number) => setHolders((hs) => hs.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel className="flex flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim">
              Holder ledger · private
            </span>
            <span className="font-mono text-[11px] text-slate">{holders.length}/16</span>
          </div>
          <div className="flex flex-col divide-y divide-line">
            {holders.map((h, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <input
                  value={h.userId}
                  onChange={(e) => setHolder(i, "userId", e.target.value)}
                  className="w-16 bg-transparent font-mono text-sm text-bone-dim outline-none"
                  aria-label={`Holder ${i + 1} id`}
                />
                <input
                  value={h.balance}
                  onChange={(e) => setHolder(i, "balance", e.target.value)}
                  className="flex-1 bg-transparent text-right font-mono text-sm tabular-nums outline-none"
                  aria-label={`Holder ${i + 1} balance`}
                />
                <button
                  onClick={() => removeHolder(i)}
                  className="text-slate transition hover:text-failed"
                  aria-label={`Remove holder ${i + 1}`}
                >
                  <Trash size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <button
              onClick={addHolder}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-brass hover:text-bone"
            >
              <Plus size={13} /> Add holder
            </button>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate">
                Total liabilities
              </div>
              <div className="font-mono text-lg tabular-nums">{fmtAmount(liabilities)}</div>
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col items-center gap-4 p-6">
          <SolvencySeal status={pending ? "none" : status} className="w-44" />
          <div className="grid w-full grid-cols-2 gap-3 text-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate">
                Reserves
              </div>
              <div className="font-mono text-base tabular-nums">{fmtAmount(reserves)}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate">Epoch</div>
              <div className="font-mono text-base tabular-nums">{epoch ?? "—"}</div>
            </div>
          </div>
          <div className="flex w-full items-center gap-2">
            <input
              value={drainAmount}
              onChange={(e) => setDrainAmount(e.target.value)}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-right font-mono text-sm tabular-nums outline-none focus:border-brass/40"
              aria-label="Drain amount"
            />
            <button
              onClick={() => run("Drained reserves", () => drainReserves(drainAmount))}
              disabled={pending}
              className="shrink-0 rounded-lg border border-failed/40 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] text-failed transition hover:bg-failed/10 disabled:opacity-40"
            >
              Drain
            </button>
          </div>
          <button
            onClick={() => run("Restored reserves", () => mintReserves("1000000"))}
            disabled={pending}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-slate transition hover:text-bone disabled:opacity-40"
          >
            <ArrowClockwise size={13} /> Restore reserves
          </button>
        </Panel>
      </div>

      <button
        onClick={() => run("Attestation published", () => publishAttestation(holders))}
        disabled={pending}
        className="w-full rounded-xl bg-bone py-4 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:opacity-50"
      >
        {pending && stage === "Attestation published"
          ? "Generating proof and submitting on-chain…"
          : "Publish attestation"}
      </button>

      {(tx || error || pending) && (
        <Panel className="px-5 py-4">
          {pending && <p className="font-mono text-sm text-bone-dim">{stage}…</p>}
          {error && !pending && <p className="font-mono text-sm text-failed">{error}</p>}
          {tx && !pending && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-sm text-proven">{tx.label}</span>
              {tx.hash && (
                <a
                  href={explorerTx(tx.hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-brass hover:text-bone"
                >
                  View transaction <ArrowSquareOut size={13} />
                </a>
              )}
            </div>
          )}
        </Panel>
      )}

      <Panel className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim">
          <ShieldCheck size={14} className="text-brass" /> Holder inclusion check
        </div>
        <p className="text-sm text-bone-dim">
          Any holder can confirm their balance was counted in the proven total, without seeing anyone
          else&apos;s.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {holders.map((h, i) => (
            <button
              key={i}
              onClick={async () => {
                const r = await checkInclusion(holders, i);
                setInclusion({ index: i, ok: r.ok, balance: r.balance });
              }}
              className="rounded-full border border-line px-3 py-1 font-mono text-xs text-bone-dim transition hover:border-brass/40 hover:text-bone"
            >
              holder {h.userId}
            </button>
          ))}
        </div>
        {inclusion && (
          <p
            className={cn(
              "font-mono text-sm",
              inclusion.ok ? "text-proven" : "text-failed",
            )}
          >
            {inclusion.ok
              ? `Holder ${holders[inclusion.index]?.userId} with balance ${fmtAmount(inclusion.balance)} is included in the proven total.`
              : "Inclusion check failed."}
          </p>
        )}
      </Panel>
    </div>
  );
}
