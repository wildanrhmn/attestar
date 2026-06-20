const roles = [
  {
    title: "Issuer",
    body: "Publish a zero-knowledge proof each epoch that reserves cover every holder balance.",
  },
  {
    title: "Holder",
    body: "Verify your own balance is counted in the proven total, without seeing anyone else's.",
  },
  {
    title: "Auditor",
    body: "Use a view key for full selective disclosure of the figures behind the proof.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-12 px-6 py-20">
      <header className="flex flex-col gap-4">
        <span className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Real-World ZK on Stellar
        </span>
        <h1 className="text-5xl font-semibold tracking-tight">Attestar</h1>
        <p className="text-xl text-neutral-300">
          Continuous, provable solvency for stablecoin and RWA issuers. Prove that reserves cover
          all liabilities, on-chain, every epoch, without revealing a single balance.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {roles.map((r) => (
          <div
            key={r.title}
            className="rounded-xl border border-neutral-800 bg-neutral-950 p-5"
          >
            <h2 className="mb-2 text-lg font-medium">{r.title}</h2>
            <p className="text-sm text-neutral-400">{r.body}</p>
          </div>
        ))}
      </section>

      <footer className="text-sm text-neutral-500">
        Zero-knowledge proofs verified inside a Soroban smart contract. Built for Stellar Hacks:
        Real-World ZK.
      </footer>
    </main>
  );
}
