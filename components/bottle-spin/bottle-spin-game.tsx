"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { GameCard } from "@/components/ui/game-card";
import { MainButton } from "@/components/ui/main-button";
import { bottleChallengeTemplates, type BottleChallengeLevel } from "@/data/bottle_challenges";
import { cn } from "@/lib/utils";

type Pair = {
  top: string;
  bottom: string;
};

type ChallengeSource = "base" | "custom";
type Level = BottleChallengeLevel;

const defaultPlayers = [
  "Alex",
  "Riley",
  "Jordan"
];

const SPIN_DURATION_MS = 2600;

const formatChallenge = (template: string | undefined, pair: Pair) => {
  const safeTemplate = template ?? "{{top}} & {{bottom}} take the spotlight.";
  let message = safeTemplate
    .replace(/{{top}}/gi, pair.top)
    .replace(/{{bottom}}/gi, pair.bottom);

  if (!safeTemplate.includes("{{top}}") && !safeTemplate.includes("{{bottom}}")) {
    message = `${pair.top} & ${pair.bottom} ${safeTemplate}`;
  }

  return message;
};

export function BottleSpinGame() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [level, setLevel] = useState<Level>("basic");
  const [players, setPlayers] = useState<string[]>(() => defaultPlayers);
  const [pair, setPair] = useState<Pair>(() => ({
    top: defaultPlayers[0],
    bottom: defaultPlayers[1] ?? defaultPlayers[0],
  }));
  const [challenge, setChallenge] = useState<string>(() =>
    formatChallenge(bottleChallengeTemplates[0], {
      top: defaultPlayers[0],
      bottom: defaultPlayers[1] ?? defaultPlayers[0],
    }),
  );
  const [challengeSource, setChallengeSource] = useState<ChallengeSource>("base");
  const [customChallenges, setCustomChallenges] = useState<Record<Level, string[]>>(() => ({
    basic: [],
    normal: [],
    advance: [],
    hardcore: [],
  }));
  const [inputValue, setInputValue] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const levelOptions = useMemo(
    () => [
      { id: "basic" as Level, label: "Basic", emoji: "😌" },
      { id: "normal" as Level, label: "Normal", emoji: "😏" },
      { id: "advance" as Level, label: "Advance", emoji: "🥴" },
      { id: "hardcore" as Level, label: "Hardcore", emoji: "😈" },
    ],
    [],
  );

  const availablePlayers = useMemo(() => players, [players]);

  const pickDistinctPairFrom = useCallback((pool: string[]): Pair => {
    if (pool.length === 0) {
      return { top: "Add players", bottom: "Add players" };
    }
    if (pool.length === 1) {
      return { top: pool[0], bottom: pool[0] };
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return { top: shuffled[0], bottom: shuffled[1] };
  }, []);

  const selectChallenge = useCallback(
    (nextPair: Pair, levelKey: Level) => {
      const customList = customChallenges[levelKey];
      const baseList = bottleChallengeTemplates[levelKey];
      const useCustom = customList.length > 0 && Math.random() < 0.5;
      const pool = useCustom ? customList : baseList;
      const fallbackTemplate = baseList[0] ?? customList[0] ?? "{{top}} & {{bottom}} celebrate the spin.";
      const randomTemplate = pool[Math.floor(Math.random() * pool.length)] ?? fallbackTemplate;
      setChallenge(formatChallenge(randomTemplate, nextPair));
      setChallengeSource(useCustom ? "custom" : "base");
      setAnimationKey((prev) => prev + 1);
    },
    [customChallenges],
  );

  const concludeSpin = () => {
    const nextPair = pickDistinctPairFrom(players);
    setPair(nextPair);
    selectChallenge(nextPair, level);
    setIsSpinning(false);
  };

  const handleSpin = () => {
    if (isSpinning || players.length < 2) return;
    setIsSpinning(true);
    const extraRotation = 1080 + Math.floor(Math.random() * 720);
    setRotation((prev) => prev + extraRotation);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(concludeSpin, SPIN_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    if (players.length >= 2) {
      const nextPair = pickDistinctPairFrom(players);
      setPair(nextPair);
      selectChallenge(nextPair, level);
    }
  }, [level, pickDistinctPairFrom, players, selectChallenge]);

  useEffect(() => {
    if (players.length < 2) {
      setPair({
        top: players[0] ?? "Add players",
        bottom: players[0] ?? "Add players",
      });
      setChallenge("Add at least two players to unlock new dares.");
      setChallengeSource("base");
      return;
    }

    if (!players.includes(pair.top) || !players.includes(pair.bottom) || pair.top === pair.bottom) {
      const nextPair = pickDistinctPairFrom(players);
      setPair(nextPair);
      selectChallenge(nextPair, level);
    }
  }, [level, pair, pickDistinctPairFrom, players, selectChallenge]);

  const handleAddChallenge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    setCustomChallenges((prev) => {
      const list = prev[level];
      if (list.includes(value)) return prev;
      return {
        ...prev,
        [level]: [...list, value],
      };
    });
    setInputValue("");
  };

  const handleAddPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newPlayerName.trim();
    if (!name) return;
    setPlayers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setNewPlayerName("");
  };

  const handleDeletePlayer = (index: number) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const startEditingPlayer = (index: number) => {
    setEditingIndex(index);
    setEditingValue(players[index]);
  };

  const handleSavePlayer = () => {
    if (editingIndex === null) return;
    const nextValue = editingValue.trim();
    if (!nextValue) return;
    setPlayers((prev) =>
      prev.map((player, index) => {
        if (index === editingIndex) {
          return nextValue;
        }
        return player;
      }),
    );
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const customCount = customChallenges[level]?.length ?? 0;
  const levelInfo = levelOptions.find((option) => option.id === level) ?? levelOptions[0];
  const canSpin = !isSpinning && players.length >= 2;
  const needsPlayers = players.length < 2;

  return (
    <div className="space-y-10">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 order-2 lg:order-1">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Challenge Level</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

          <div className="relative mx-auto flex h-80 w-80 items-center justify-center rounded-full border border-white/10 bg-white/5 shadow-glow sm:h-96 sm:w-96">
            <div className="absolute inset-6 rounded-full border border-white/10" />
            <Image
              src="/bottle.webp"
              alt="Spinning bottle"
              width={220}
              height={220}
              priority
              className={cn(
                "select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)]",
                "transition-transform duration-[2600ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]",
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
            <div className="pointer-events-none absolute top-2 h-10 w-2 rounded-full bg-white/60" />
            <div className="pointer-events-none absolute bottom-2 h-10 w-2 rounded-full bg-white/60" />
          </div>

          <div className="flex justify-center">
            <MainButton
              variant="solid"
              className="w-full max-w-xs"
              onClick={handleSpin}
              disabled={!canSpin}
            >
              {isSpinning ? "Spinning..." : "Spin the Bottle"}
            </MainButton>
          </div>

          {needsPlayers && (
            <p className="text-center text-xs uppercase tracking-[0.3em] text-red-200">
              Add at least two players to spin
            </p>
          )}

          <div className="rounded-3xl border border-white/10 p-4 text-left text-white/70">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">Players</p>
              <span className="text-xs text-white/50">{players.length} active</span>
            </div>
            <form onSubmit={handleAddPlayer} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={newPlayerName}
                onChange={(event) => setNewPlayerName(event.target.value)}
                placeholder="Add player name"
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />
              <MainButton
                type="submit"
                variant="solid"
                className={cn(
                  "w-full sm:w-auto transition",
                  !newPlayerName.trim() && "!border-white/40 !bg-white/30 !text-black/60",
                )}
                disabled={!newPlayerName.trim()}
              >
                Add
              </MainButton>
            </form>

            <div className="mt-4 space-y-2">
              {availablePlayers.map((player, index) => {
                const isEditing = editingIndex === index;
                return (
                  <div
                    key={`${player}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    {isEditing ? (
                      <>
                        <input
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          className="flex-1 rounded-xl border border-white/20 bg-black/20 px-3 py-1 text-white focus:border-white/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSavePlayer}
                          className="rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white hover:border-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/60 hover:border-white/40"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-white">{player}</span>
                        <button
                          type="button"
                          onClick={() => startEditingPlayer(index)}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80 hover:border-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlayer(index)}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-red-200 hover:border-red-200"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              {players.length === 0 && (
                <p className="text-xs text-white/40">Add at least two players to start the game.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 order-1 lg:order-2">
          <GameCard animateKey={animationKey} className="space-y-5 text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">pair</p>
                <div className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                  <span className="text-white/80">Top:</span> {pair.top}
                </div>
                <div className="text-xl font-semibold text-white sm:text-2xl">
                  <span className="text-white/80">Bottom:</span> {pair.bottom}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/60">
                  {challengeSource === "custom" ? "Custom" : "Deck"}
                </span>
                <span className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.4em] text-white/60">
                  {level.toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-2xl font-medium leading-snug text-white sm:text-3xl">{challenge}</p>
            <p className="text-xs text-white/40">
              Tip: Custom prompts that include <span className="font-semibold text-white">top</span> and{" "}
              <span className="font-semibold text-white">bottom</span> will autofill names.
            </p>
          </GameCard>

          <div className="blur-card space-y-4 rounded-3xl border border-white/10 p-6 shadow-glow">
            <form onSubmit={handleAddChallenge} className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                  Add a {levelInfo.label.toLowerCase()} challenge
                </p>
                <p className="text-xs text-white/40">
                  Use <span className="font-semibold text-white">top</span> and{" "}
                  <span className="font-semibold text-white">bottom</span> to reference the two players for this level.
                </p>
              </div>

              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={`Example: top dares bottom to lead a ${levelInfo.label.toLowerCase()} victory dance.`}
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
                  Save challenge
                </MainButton>
                <p className="text-xs text-white/50">
                  {customCount > 0
                    ? `${customCount} custom ${levelInfo.label.toLowerCase()} challenge${customCount > 1 ? "s" : ""} saved`
                    : `No custom ${levelInfo.label.toLowerCase()} challenges yet`}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
