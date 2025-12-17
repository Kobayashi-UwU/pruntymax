"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { GameCard } from "@/components/ui/game-card";
import { MainButton } from "@/components/ui/main-button";
import { dareQuestions } from "@/data/truth_or_dare";
import { cn } from "@/lib/utils";

const SPIN_DURATION_MS = 3200;
const CUSTOM_WEIGHT = 0.5;

const levelOptions = [
  { id: "basic", label: "Basic", emoji: "😌" },
  { id: "normal", label: "Normal", emoji: "😏" },
  { id: "advance", label: "Advance", emoji: "🥴" },
  { id: "hardcore", label: "Hardcore", emoji: "😈" },
] as const;

type Level = (typeof levelOptions)[number]["id"];
type DareSource = "base" | "custom";

const dareDeck = dareQuestions as Record<Level, readonly string[]>;

const createEmptyLevelMap = () =>
  levelOptions.reduce<Record<Level, string[]>>((acc, option) => {
    acc[option.id] = [];
    return acc;
  }, {} as Record<Level, string[]>);

const ROULETTE_SEGMENTS = ["red", "black", "red", "black", "red", "black", "red", "black"] as const;
const SEGMENT_SIZE = 360 / ROULETTE_SEGMENTS.length;

type SegmentColor = (typeof ROULETTE_SEGMENTS)[number];

const colorMeta: Record<
  SegmentColor,
  {
    label: string;
    accent: string;
    description: string;
  }
> = {
  red: {
    label: "Red",
    accent: "#f87171",
    description: "Hold your cup in the air",
  },
  black: {
    label: "Black",
    accent: "#111827",
    description: "Place your cup on the table",
  },
};

const fallbackMessage = "Add a dare to keep the wheel spicy.";

export function DrinkingRouletteGame() {
  const [level, setLevel] = useState<Level>("basic");
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentColor, setCurrentColor] = useState<SegmentColor>("red");
  const [currentDare, setCurrentDare] = useState<string>(() => dareDeck.basic?.[0] ?? fallbackMessage);
  const [dareSource, setDareSource] = useState<DareSource>("base");
  const [customDares, setCustomDares] = useState<Record<Level, string[]>>(() => createEmptyLevelMap());
  const [inputValue, setInputValue] = useState("");
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(true);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gradientStops = useMemo(() => {
    return ROULETTE_SEGMENTS.map((segment, index) => {
      const start = index * SEGMENT_SIZE;
      const end = start + SEGMENT_SIZE;
      return `${colorMeta[segment].accent} ${start}deg ${end}deg`;
    }).join(", ");
  }, []);

  const selectDare = useCallback(
    (levelKey: Level) => {
      const baseList = dareDeck[levelKey] ?? [];
      const customList = customDares[levelKey] ?? [];
      const shouldUseCustom = customList.length > 0 && Math.random() < CUSTOM_WEIGHT;
      const useCustomPool = (shouldUseCustom || baseList.length === 0) && customList.length > 0;
      const candidatePool = useCustomPool ? customList : baseList;
      const nextDare = candidatePool[Math.floor(Math.random() * candidatePool.length)] ?? fallbackMessage;
      setDareSource(useCustomPool ? "custom" : "base");
      if (!nextDare) {
        return fallbackMessage;
      }
      return nextDare;
    },
    [customDares],
  );

  const handleSpin = () => {
    if (isSpinning) return;
    const targetIndex = Math.floor(Math.random() * ROULETTE_SEGMENTS.length);
    const winningColor = ROULETTE_SEGMENTS[targetIndex];

    setIsSpinning(true);
    setIsResultModalOpen(false);

    setRotation((prev) => {
      const prevMod = ((prev % 360) + 360) % 360;
      const targetCenter = targetIndex * SEGMENT_SIZE + SEGMENT_SIZE / 2;
      const offsetToTarget = (targetCenter - prevMod + 360) % 360;
      const extraSpins = 3 + Math.floor(Math.random() * 3);
      return prev + extraSpins * 360 + offsetToTarget;
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const nextDare = selectDare(level);
      setCurrentColor(winningColor);
      setCurrentDare(nextDare);
      setIsSpinning(false);
      setIsResultModalOpen(true);
      setAnimationKey((prev) => prev + 1);
    }, SPIN_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleAddDare = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setCustomDares((prev) => {
      if (prev[level].includes(value)) {
        return prev;
      }

      return {
        ...prev,
        [level]: [...prev[level], value],
      };
    });

    setInputValue("");
  };

  const reopenRules = () => setIsRuleModalOpen(true);
  const closeResultModal = () => setIsResultModalOpen(false);

  const customCount = customDares[level]?.length ?? 0;
  const levelInfo = levelOptions.find((option) => option.id === level) ?? levelOptions[0];
  const currentMeta = colorMeta[currentColor];
  const canSpin = !isSpinning;

  return (
    <div className="space-y-10 text-left">
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
          <div className="w-full max-w-lg space-y-5 rounded-3xl border border-white/15 bg-black/70 p-6 text-white shadow-glow">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">How to play</p>
            <h2 className="text-2xl font-semibold">Drinking Roulette</h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-white/80">
              <li>Everyone picks a side: cups down on the table for Black or cups raised high for Red.</li>
              <li>Tap Spin. The wheel will land on a color and crown the dare squad.</li>
              <li>The winning color reads the dare out loud and follows through. No excuses.</li>
            </ol>
            <p className="text-sm text-white/60">Add your own dares or switch difficulty at any time.</p>
            <MainButton variant="solid" className="w-full" onClick={() => setIsRuleModalOpen(false)}>
              Got it — let&apos;s spin
            </MainButton>
          </div>
        </div>
      )}

      {isResultModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 py-6">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/15 bg-black/80 p-6 text-white shadow-glow">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Winning color</p>
            <div
              className="rounded-2xl border border-white/10 px-5 py-4 text-center text-lg font-semibold uppercase tracking-[0.3em]"
              style={{ background: `${currentMeta.accent}22`, color: currentColor === "black" ? "#f3f4f6" : "#0f172a" }}
            >
              {currentMeta.label}
            </div>
            <GameCard animateKey={animationKey} className="space-y-3 bg-white/5 text-left text-white">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Dare</p>
              <p className="text-xl font-medium leading-relaxed">{currentDare}</p>
              <p className="text-xs text-white/50">
                Source: {dareSource === "custom" ? "Custom deck" : "PartyOG deck"} · Level {levelInfo.label} {levelInfo.emoji}
              </p>
            </GameCard>
            <MainButton variant="solid" className="w-full" onClick={closeResultModal}>
              Back to the table
            </MainButton>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Level</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {levelOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLevel(option.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all",
                  option.id === level
                    ? "border-white bg-white text-black shadow-glow"
                    : "border-white/30 text-white/70 hover:border-white hover:text-white",
                )}
              >
                <span>{option.label}</span>
                <span className="text-lg">{option.emoji}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={reopenRules}
          className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-white hover:text-white"
        >
          Rules
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="order-2 space-y-6 lg:order-1">
          <div className="relative mx-auto flex h-80 w-80 items-center justify-center rounded-full border border-white/10 bg-black/30 shadow-glow sm:h-96 sm:w-96">
            <div
              className="absolute inset-0 rounded-full border border-white/10 transition-transform duration-[3200ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                background: `conic-gradient(from -90deg, ${gradientStops})`,
                transform: `rotate(${rotation}deg)`,
              }}
            />
            <div className="relative z-10 h-32 w-32 rounded-full border border-white/20 bg-black/40 backdrop-blur">
              <div className="absolute inset-3 rounded-full border border-white/10" />
            </div>
            <div className="pointer-events-none absolute -top-2 h-12 w-6 rounded-full bg-white/80 shadow-lg shadow-black/40" />
            <div className="pointer-events-none absolute inset-4 rounded-full border border-white/5" />
          </div>

          <div className="flex justify-center">
            <MainButton variant="solid" className="w-full max-w-xs" onClick={handleSpin} disabled={!canSpin}>
              {isSpinning ? "Spinning..." : "Spin the roulette"}
            </MainButton>
          </div>
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <GameCard animateKey={animationKey} className="space-y-4 text-left">
            <div className="flex flex-col gap-2 text-white">
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Latest dare</p>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full border border-white/20"
                  style={{ backgroundColor: colorMeta[currentColor].accent }}
                />
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/70">{colorMeta[currentColor].label}</p>
                  <p className="text-xs text-white/50">{colorMeta[currentColor].description}</p>
                </div>
              </div>
            </div>
            <p className="text-2xl font-medium leading-snug text-white sm:text-3xl">{currentDare}</p>
            <p className="text-xs text-white/40">
              Source: {dareSource === "custom" ? "Custom deck" : "PartyOG deck"} · Level {levelInfo.label} {levelInfo.emoji}
            </p>
          </GameCard>

          <div className="blur-card space-y-4 rounded-3xl border border-white/10 p-6 shadow-glow">
            <form onSubmit={handleAddDare} className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  Add a {levelInfo.label.toLowerCase()} dare
                </p>
                <p className="text-xs text-white/40">Custom dares have a boosted 50% chance of appearing.</p>
              </div>

              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={`Example: Winning ${colorMeta.red.label.toLowerCase()} team hands out ${levelInfo.label.toLowerCase()} sips.`}
                className="min-h-[110px] w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <MainButton
                  type="submit"
                  variant="solid"
                  className={cn(
                    "w-full sm:w-auto transition",
                    !inputValue.trim() && "!border-white/40 !bg-white/30 !text-black/60",
                  )}
                  disabled={!inputValue.trim()}
                >
                  Save dare
                </MainButton>
                <p className="text-xs text-white/50">
                  {customCount > 0
                    ? `${customCount} custom dare${customCount > 1 ? "s" : ""} at this level`
                    : "No custom dares yet"}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

