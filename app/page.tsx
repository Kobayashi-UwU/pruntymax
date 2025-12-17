import { MainLinkButton } from "@/components/ui/main-button";
import { PageHeader } from "@/components/ui/page-header";

type GameLink = {
  label: string;
  href?: string;
  status: "available" | "coming soon";
};

const games: GameLink[] = [
  { label: "Truth or Dare", href: "/truth-or-dare", status: "available" },
  { label: "Bottle Spin", href: "/bottle-spin", status: "available" },
  { label: "Drinking Roulette", href: "/drinking-roulette", status: "available" },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl space-y-12 text-center">
        <PageHeader title="PartyOG" subtitle="Free party games for everyone" />

        <div className="grid gap-4">
          {games.map((game) => (
            <div key={game.label} className="space-y-2">
              {game.status === "available" ? (
                <MainLinkButton
                  href={game.href}
                  className="w-full text-lg"
                  variant="solid"
                >
                  {game.label}
                </MainLinkButton>
              ) : (
                <MainLinkButton disabled className="w-full text-lg">
                  {game.label}
                </MainLinkButton>
              )}
              {game.status !== "available" && (
                <p className="text-sm uppercase tracking-widest text-white/40">Coming Soon</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
