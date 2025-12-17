import Link from "next/link";

import { DrinkingRouletteGame } from "@/components/drinking-roulette/drinking-roulette-game";
import { PageHeader } from "@/components/ui/page-header";

export default function DrinkingRoulettePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-5xl space-y-8 text-center">
        <div className="flex">
          <Link
            href="/"
            aria-label="Back to homepage"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 text-2xl text-white transition hover:border-white hover:bg-white/10"
          >
            ←
          </Link>
        </div>
        <PageHeader
          eyebrow="PartyOG"
          title="Drinking Roulette"
          subtitle="Pick a color, spin the wheel, and let the winning crew take on a dare."
        />
        <DrinkingRouletteGame />
      </div>
    </main>
  );
}

