"use client";

import { Buffer } from "buffer";
import { useCallback, useEffect, useState } from "react";
import { User, ShieldCheck, Wallet, SealCheck, Warning } from "@phosphor-icons/react";
import { useWallet } from "@/lib/wallet";
import { attestarReader } from "@/lib/contracts";
import { inclusionForBrowser } from "@/lib/prover-browser";
import { loadLedger, toHolders, matchByAddress, type LedgerEntry } from "@/lib/ledger";
import { Panel, Eyebrow, Stat } from "@/components/panel";
import { baseToUsdc, shortHash } from "@/lib/format";
import { cn } from "@/lib/cn";

interface Published {
  epoch: string;
  solvent: boolean;
  liabRootHex: string;
}

interface InclusionView {
  ok: boolean;
  balance: string;
  rootHex: string;
  matchesChain: boolean;
}

export function HolderView() {
  const { address, connect, connecting } = useWallet();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [published, setPublished] = useState<Published | null>(null);
  const [selected, setSelected] = useState(0);
  const [result, setResult] = useState<InclusionView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLedger(loadLedger());
  }, []);

  useEffect(() => {
    if (address) {
      const i = matchByAddress(loadLedger(), address);
      if (i >= 0) setSelected(i);
    }
  }, [address]);

  const refresh = useCallback(async () => {
    try {
      const latest = await attestarReader().latest().then((t) => t.result);
      if (latest) {
        setPublished({
          epoch: latest.epoch.toString(),
          solvent: latest.solvent,
          liabRootHex: Buffer.from(latest.liab_root).toString("hex"),
        });
      } else {
        setPublished(null);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function verify() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const inc = await inclusionForBrowser(toHolders(ledger), selected);
      setResult({
        ok: inc.ok,
        balance: inc.balance,
        rootHex: inc.rootHex,
        matchesChain: !!published && inc.rootHex === published.liabRootHex,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const matched = address ? matchByAddress(ledger, address) : -1;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-col gap-2 pt-4">
        <Eyebrow>Holder console</Eyebrow>
        <h1 className="font-display text-4xl tracking-tight">Confirm your balance was counted.</h1>
        <p className="max-w-2xl text-bone-dim">
          You should not have to trust the issuer&apos;s figures. Verify your own balance is included
          in the liabilities the proof committed to, without seeing anyone else&apos;s balance and
          without revealing yours.
        </p>
      </header>

      <Panel className="border-brass/20 px-5 py-3">
        <p className="text-[12px] leading-relaxed text-bone-dim">
          You are acting as a <span className="text-bone">holder</span> (a customer of the issuer),
          not the issuer. The balance below is what the issuer <span className="text-bone">owes you</span>,
          a liability. That is a different thing from the issuer&apos;s reserve wallet, so it will not
          match the USDC you drained in the issuer console.
        </p>
      </Panel>

      {!address ? (
        <Panel className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-brass/30 text-brass">
            <User size={22} weight="light" />
          </span>
          <p className="max-w-md text-bone-dim">
            Connect your wallet. If your address is registered to a holder, we&apos;ll match it
            automatically.
          </p>
          <button
            onClick={() => connect("holder")}
            disabled={connecting}
            className="inline-flex items-center gap-2 rounded-full bg-bone px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:opacity-50"
          >
            <Wallet size={15} /> {connecting ? "Connecting…" : "Connect Freighter"}
          </button>
        </Panel>
      ) : (
        <>
          <Panel className="grid gap-4 px-5 py-4 sm:grid-cols-3">
            <Stat label="Latest epoch" value={published?.epoch ?? "—"} />
            <Stat
              label="Public verdict"
              value={published ? (published.solvent ? "Solvent" : "Insolvent") : "—"}
              tone={published ? (published.solvent ? "proven" : "failed") : "default"}
            />
            <Stat label="Liabilities root" value={shortHash(published?.liabRootHex, 6)} />
          </Panel>

          <Panel className="flex flex-col gap-4 px-5 py-5">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim">
              <ShieldCheck size={14} className="text-brass" /> Your inclusion
            </div>
            {matched >= 0 ? (
              <p className="text-sm text-bone-dim">
                Matched to <span className="text-bone">{ledger[matched]?.label}</span> by your
                address {shortHash(address, 5)}.
              </p>
            ) : (
              <p className="text-sm text-bone-dim">
                Your address isn&apos;t registered to a holder. Pick which holder you are for the demo
                inclusion check.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {ledger.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-xs transition",
                    selected === i
                      ? "border-brass/60 text-bone"
                      : "border-line text-bone-dim hover:border-brass/40 hover:text-bone",
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <button
              onClick={verify}
              disabled={busy || !published}
              className="self-start rounded-xl bg-bone px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:opacity-40"
            >
              {busy ? "Verifying…" : "Verify my inclusion"}
            </button>
            {!published && (
              <p className="font-mono text-xs text-slate">No attestation published yet.</p>
            )}
          </Panel>

          {error && (
            <Panel className="px-5 py-4" aria-live="polite">
              <p className="font-mono text-sm text-failed">{error}</p>
            </Panel>
          )}

          {result && (
            <Panel
              className={cn(
                "flex flex-col gap-3 px-5 py-5",
                result.ok && result.matchesChain ? "border-proven/40" : "border-failed/40",
              )}
              aria-live="polite"
            >
              <div
                className={cn(
                  "inline-flex items-center gap-2 font-mono text-sm",
                  result.ok && result.matchesChain ? "text-proven" : "text-failed",
                )}
              >
                {result.ok && result.matchesChain ? <SealCheck size={18} /> : <Warning size={18} />}
                {result.ok && result.matchesChain
                  ? "Your balance is committed in the proof the chain verified."
                  : result.ok
                    ? "Inclusion holds, but the tree does not match the on-chain root."
                    : "Inclusion check failed."}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Stat label="What the issuer owes you · a liability (private)" value={`${baseToUsdc(result.balance)} USDC`} />
                <Stat
                  label="Root matches on-chain"
                  value={result.matchesChain ? "Yes" : "No"}
                  tone={result.matchesChain ? "proven" : "failed"}
                />
              </div>
              <p className="font-mono text-[11px] text-slate">
                computed {shortHash(result.rootHex, 8)} · on-chain {shortHash(published?.liabRootHex, 8)}
              </p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
