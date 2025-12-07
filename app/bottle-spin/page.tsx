import Link from "next/link";

import { BottleSpinGame } from "@/components/bottle-spin/bottle-spin-game";
import { PageHeader } from "@/components/ui/page-header";

export default function BottleSpinPage() {
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
          title="Bottle Spin"
          subtitle="Spin the bottle, pair up the ends, and follow the challenge that fate deals out."
        />
        <BottleSpinGame />
      </div>
    </main>
  );
}
