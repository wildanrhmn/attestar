import { getState } from "./actions";
import { SolvencySeal } from "@/components/solvency-seal";
import { Eyebrow, Stat } from "@/components/panel";
import { Console } from "@/components/console";
import { fmtAmount, shortHash, explorerContract } from "@/lib/format";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    n: "01",
    title: "Commit",
    body: "The issuer builds a Merkle-sum tree of every holder balance. Each leaf is a Poseidon hash of the account and its balance; every node also carries the sum of its subtree.",
  },
  {
    n: "02",
    title: "Prove",
    body: "A Groth16 circuit proves the published total is the honest sum of non-negative balances, with a range check on each one. No individual balance is revealed.",
  },
  {
    n: "03",
    title: "Verify",
    body: "A Soroban contract checks the proof with Stellar's BN254 host functions, reads on-chain reserves, and records the epoch as solvent only if reserves cover the proven liabilities.",
  },
];

export default async function Home() {
  const state = await getState();
  const status = state.solvent === true ? "solvent" : state.solvent === false ? "insolvent" : "none";
  const attestarId = process.env.NEXT_PUBLIC_ATTESTAR_ID ?? "";

  return (
    <main className="mx-auto max-w-5xl px-6 pb-32">
      <nav className="flex items-center justify-between py-6">
        <span className="font-display text-lg tracking-tight">Attestar</span>
        <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-bone-dim">
          <a href="#how" className="hover:text-bone">
            How it works
          </a>
          <a href="#demo" className="hover:text-bone">
            Live demo
          </a>
          <a
            href={explorerContract(attestarId)}
            target="_blank"
            rel="noreferrer"
            className="text-brass hover:text-bone"
          >
            On-chain
          </a>
        </div>
      </nav>

      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.1fr_auto] md:py-24">
        <div className="flex flex-col gap-6 rise">
          <Eyebrow>Zero-knowledge proof of reserves · Stellar</Eyebrow>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Solvency you can <span className="italic text-brass">verify</span>, not just trust.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-bone-dim">
            Attestar proves a stablecoin issuer&apos;s reserves cover every holder balance, on-chain
            and every epoch, without revealing a single account. The proof is a zero-knowledge SNARK
            checked inside a Soroban smart contract.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-2 sm:grid-cols-4">
            <Stat label="Latest epoch" value={state.epoch ?? "—"} />
            <Stat
              label="Verdict"
              value={status === "none" ? "—" : status === "solvent" ? "Solvent" : "Insolvent"}
              tone={status === "solvent" ? "proven" : status === "insolvent" ? "failed" : "default"}
            />
            <Stat label="Reserves" value={fmtAmount(state.onchainReserves)} />
            <Stat label="Liabilities" value={fmtAmount(state.totalLiabilities)} />
          </div>
          <div className="pt-2">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full bg-bone px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-white"
            >
              Run the live demo
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <SolvencySeal status={status} className="w-72 rise" />
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <h2 className="font-display text-3xl leading-tight tracking-tight">
            Today, reserves are a monthly PDF.
          </h2>
          <p className="text-lg leading-relaxed text-bone-dim">
            Proof-of-reserves is an off-chain accounting attestation, published monthly and taken on
            faith. In April 2026 a regulated exchange kept claiming solvency while its hot wallet
            drained to nothing. Regulations like the GENIUS Act and MiCA now demand continuous
            backing, but the proof still arrives once a month in a document. Attestar replaces the
            faith with math that anyone can check, the moment it changes.
          </p>
        </div>
      </section>

      <section id="how" className="border-t border-line py-16">
        <Eyebrow>How it works</Eyebrow>
        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-3 bg-ink p-6">
              <span className="font-mono text-xs text-brass">{s.n}</span>
              <h3 className="font-display text-xl tracking-tight">{s.title}</h3>
              <p className="text-sm leading-relaxed text-bone-dim">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="border-t border-line py-16">
        <Eyebrow>Live demo · Stellar testnet</Eyebrow>
        <h2 className="mt-4 max-w-2xl font-display text-3xl leading-tight tracking-tight">
          Publish an attestation. Then drain the reserves and watch it fail.
        </h2>
        <p className="mt-3 max-w-2xl text-bone-dim">
          Every action below is a real transaction against the Attestar contract on Stellar testnet.
          The proof is generated from the holder ledger and verified on-chain.
        </p>
        <div className="mt-8">
          <Console
            initialStatus={status}
            initialReserves={state.onchainReserves}
            initialEpoch={state.epoch}
          />
        </div>
      </section>

      <footer className="border-t border-line pt-10 text-sm text-bone-dim">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
              The honest boundary
            </span>
            <p className="leading-relaxed">
              Zero-knowledge proves the liabilities sum and the on-chain reserves trustlessly. It
              cannot prove that off-chain fiat reserves exist; that figure enters as a signed
              attestation. Attestar makes everything around the monthly audit continuous and
              verifiable. It complements the auditor, it does not replace them.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
              Contract
            </span>
            <a
              href={explorerContract(attestarId)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-bone hover:text-brass"
            >
              {shortHash(attestarId, 8)}
            </a>
            <span className="font-mono text-[11px] text-slate">
              Groth16 · BN254 · Poseidon · Soroban
            </span>
          </div>
        </div>
        <div className="mt-10 font-mono text-[11px] text-slate">Attestar · Real-World ZK on Stellar</div>
      </footer>
    </main>
  );
}
