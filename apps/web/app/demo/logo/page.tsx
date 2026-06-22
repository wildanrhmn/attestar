"use client";

import { useRef, useState } from "react";
import { MARKS, type MarkId } from "@/components/logo/attestar-marks";
import { cn } from "@/lib/cn";

export default function LogoDemoPage() {
  const [selected, setSelected] = useState<MarkId>("seal-star");
  const current = MARKS.find((m) => m.id === selected)!;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
          Demo · branding
        </div>
        <h1 className="font-display text-4xl tracking-tight">Attestar identity</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone-dim">
          Four directions for the mark, all in the brass-on-ink seal language. Attestar is an
          attestation, so every option reads as something struck or sealed, built around the Stellar
          star. Pick one and export the 1024 by 1024 asset; the chosen mark already drives the header
          and favicon.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {MARKS.map((opt) => {
            const Mark = opt.Mark;
            const active = opt.id === selected;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  "group rounded-2xl border p-5 text-left transition-colors",
                  active ? "border-brass/50 bg-brass/[0.06]" : "border-line bg-ink-raised/40 hover:border-brass/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg tracking-tight">{opt.label}</span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                      active ? "border-brass/50 text-brass" : "border-line text-slate",
                    )}
                  >
                    {active ? "selected" : "select"}
                  </span>
                </div>
                <p className="mt-1.5 min-h-[40px] text-[12px] leading-relaxed text-bone-dim">{opt.sub}</p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="flex h-28 items-center justify-center rounded-xl bg-ink">
                    <Mark size={64} className="text-brass" />
                  </div>
                  <div className="flex h-28 items-center justify-center rounded-xl bg-bone">
                    <Mark size={64} className="text-ink" />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-ink-soft px-4 py-3">
                  <Mark size={24} className="text-brass" />
                  <span className="font-display text-[15px] tracking-tight">Attestar</span>
                  <span className="ml-auto flex items-center gap-3 text-brass/70">
                    {[16, 20, 28].map((s) => (
                      <Mark key={s} size={s} />
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <Submission id={selected} label={current.label} />
      </div>
    </div>
  );
}

function Submission({ id, label }: { id: MarkId; label: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [busy, setBusy] = useState(false);

  const exportPng = async () => {
    if (!svgRef.current || busy) return;
    setBusy(true);
    try {
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${xml}`], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `attestar-logo-${id}-1024.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.alert("PNG export failed. Use the SVG download and convert in any browser.");
    } finally {
      setBusy(false);
    }
  };

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${xml}`], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attestar-logo-${id}-1024.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-14 border-t border-line pt-10">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate">Submission asset</div>
      <div className="mt-1 font-display text-2xl tracking-tight">{label} · 1024 by 1024</div>
      <p className="mt-1 max-w-xl text-sm text-bone-dim">
        Ink base with a brass glow, a green solvency glow, a faint dot grid, and the mark struck in
        brass at the center. Mark only; the name renders alongside it in the app.
      </p>

      <div className="mt-6 grid items-start gap-6 sm:grid-cols-[auto_1fr]">
        <div className="overflow-hidden rounded-2xl border border-line">
          <SubmissionSvg ref={svgRef} id={id} display={320} />
        </div>
        <div className="space-y-4 text-sm text-bone-dim">
          <p>
            The export renders this exact composition to a 1024 by 1024 canvas. PNG for thumbnails and
            app stores, SVG for everything else.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportPng}
              disabled={busy}
              className="rounded-lg bg-bone px-4 py-2 text-sm font-medium text-neutral-950 transition hover:bg-white disabled:opacity-40"
            >
              {busy ? "Rendering…" : "Download 1024 PNG"}
            </button>
            <button
              onClick={downloadSvg}
              className="rounded-lg border border-line bg-ink-raised px-4 py-2 text-sm text-bone transition-colors hover:border-brass/40"
            >
              Download SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmissionSvg({ ref, id, display }: { ref: React.Ref<SVGSVGElement>; id: MarkId; display: number }) {
  const Mark = MARKS.find((m) => m.id === id)!.Mark;
  return (
    <svg ref={ref} width={display} height={display} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="atBrass" cx="0.24" cy="0.2" r="0.5">
          <stop offset="0%" stopColor="#e2bd74" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#e2bd74" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="atSolvent" cx="0.8" cy="0.82" r="0.5">
          <stop offset="0%" stopColor="#46c68a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#46c68a" stopOpacity="0" />
        </radialGradient>
        <pattern id="atGrid" width="64" height="64" patternUnits="userSpaceOnUse">
          <path d="M64 0 H0 V64" fill="none" stroke="#ece7da" strokeOpacity="0.04" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1024" height="1024" rx="180" fill="#0a0b0d" />
      <rect width="1024" height="1024" rx="180" fill="url(#atGrid)" />
      <rect width="1024" height="1024" rx="180" fill="url(#atBrass)" />
      <rect width="1024" height="1024" rx="180" fill="url(#atSolvent)" />
      <rect x="2" y="2" width="1020" height="1020" rx="178" fill="none" stroke="#c8a86a" strokeOpacity="0.28" strokeWidth="2" />
      <Mark x={172} y={172} width={680} height={680} color="#e2bd74" />
    </svg>
  );
}
