"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { GameCard } from "@/components/ui/game-card";
import { MainButton } from "@/components/ui/main-button";
import { dareQuestions, truthQuestions } from "@/data/truth_or_dare";
import { cn } from "@/lib/utils";

type Mode = "truth" | "dare";
type Source = "base" | "custom";

const levelOptions = [
  { id: "basic", label: "Basic", emoji: "😌" },
  { id: "normal", label: "Normal", emoji: "😏" },
  { id: "advance", label: "Advance", emoji: "🥴" },
  { id: "hardcore", label: "Hardcore", emoji: "😈" },
] as const;

type LevelOption = (typeof levelOptions)[number];
type Level = LevelOption["id"];

const levelMeta = levelOptions.reduce<Record<Level, LevelOption>>((acc, option) => {
  acc[option.id] = option;
  return acc;
}, {} as Record<Level, LevelOption>);

const createEmptyLevelMap = (): Record<Level, string[]> =>
  levelOptions.reduce((acc, option) => {
    acc[option.id] = [];
    return acc;
  }, {} as Record<Level, string[]>);

const createModeLevelMap = () => ({
  truth: createEmptyLevelMap(),
  dare: createEmptyLevelMap(),
});

const truthPool = truthQuestions as Record<Level, readonly string[]>;
const darePool = dareQuestions as Record<Level, readonly string[]>;

function getRandomQuestion(list: readonly string[], exclude?: string) {
  if (list.length === 0) {
    return "";
  }

  if (list.length === 1) {
    return list[0];
  }

  let question = list[Math.floor(Math.random() * list.length)];
  while (exclude && question === exclude) {
    question = list[Math.floor(Math.random() * list.length)];
  }

  return question;
}

const CUSTOM_WEIGHT = 0.5; // 50% chance for custom prompts when available
const EMPTY_PROMPT_MESSAGE = "No prompts left in this level. Add one to keep playing.";
const INITIAL_QUESTION = truthPool.basic?.[0] ?? "";

export function TruthOrDareGame() {
  const [mode, setMode] = useState<Mode>("truth");
  const [level, setLevel] = useState<Level>("basic");
  const [question, setQuestion] = useState<string>(INITIAL_QUESTION);
  const [questionSource, setQuestionSource] = useState<Source>("base");
  const [animationKey, setAnimationKey] = useState(0);
  const [customTruths, setCustomTruths] = useState<Record<Level, string[]>>(() => createEmptyLevelMap());
  const [customDares, setCustomDares] = useState<Record<Level, string[]>>(() => createEmptyLevelMap());
  const [removedBasePrompts, setRemovedBasePrompts] = useState<Record<Mode, Record<Level, string[]>>>(() =>
    createModeLevelMap(),
  );
  const [inputValue, setInputValue] = useState("");

  const selectQuestion = useCallback(
    (nextMode: Mode, options?: { force?: boolean; levelOverride?: Level }) => {
      const levelKey = options?.levelOverride ?? level;
      const customMap = nextMode === "truth" ? customTruths : customDares;
      const baseMap = nextMode === "truth" ? truthPool : darePool;
      const removedBase = removedBasePrompts[nextMode];

      const customList = customMap[levelKey] ?? [];
      const baseList = (baseMap[levelKey] ?? []).filter(
        (item) => !removedBase[levelKey]?.includes(item),
      );

      const shouldUseCustom = customList.length > 0 && Math.random() < CUSTOM_WEIGHT;
      const useCustomPool = (shouldUseCustom || baseList.length === 0) && customList.length > 0;
      const candidateList = useCustomPool ? customList : baseList;
      const sourceLabel: Source = useCustomPool ? "custom" : "base";

      let derivedSource: Source | null = null;
      let shouldAnimate = false;

      if (candidateList.length === 0) {
        setQuestion(EMPTY_PROMPT_MESSAGE);
        setQuestionSource("base");
        setAnimationKey((prev) => prev + 1);
        return;
      }

    setQuestion((current) => {
        const next = getRandomQuestion(candidateList, options?.force ? undefined : current) || current;
        derivedSource = sourceLabel;
        shouldAnimate = true;
      return next;
    });

      if (derivedSource) {
        setQuestionSource(derivedSource);
      }

      if (shouldAnimate) {
    setAnimationKey((prev) => prev + 1);
      }
    },
    [customTruths, customDares, level, removedBasePrompts],
  );

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) {
      return;
    }
    hasHydratedRef.current = true;
    selectQuestion("truth", { force: true, levelOverride: "basic" });
  }, [selectQuestion]);

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    selectQuestion(nextMode, { force: true });
  };

  const handleLevelChange = (nextLevel: Level) => {
    setLevel(nextLevel);
    selectQuestion(mode, { force: true, levelOverride: nextLevel });
  };

  const handleRandomize = () => {
    selectQuestion(mode);
  };

  const handleDeleteCurrent = () => {
    const current = question;
    if (!current || current === EMPTY_PROMPT_MESSAGE) {
      return;
    }

    if (questionSource === "custom") {
      const updater = mode === "truth" ? setCustomTruths : setCustomDares;
      updater((prev) => {
        if (!prev[level].includes(current)) {
          return prev;
        }

        return {
          ...prev,
          [level]: prev[level].filter((item) => item !== current),
        };
      });
    } else {
      setRemovedBasePrompts((prev) => {
        if (prev[mode][level].includes(current)) {
          return prev;
        }

        return {
          ...prev,
          [mode]: {
            ...prev[mode],
            [level]: [...prev[mode][level], current],
          },
        };
      });
    }

    setTimeout(() => {
      selectQuestion(mode, { force: true });
    }, 0);
  };

  const handleAddPrompt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value) return;

    const updater = mode === "truth" ? setCustomTruths : setCustomDares;
    updater((prev) => {
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

  const customCount = mode === "truth" ? customTruths[level].length : customDares[level].length;
  const availableBase = (() => {
    const baseMap = mode === "truth" ? truthPool : darePool;
    const removed = removedBasePrompts[mode][level] ?? [];
    return (baseMap[level] ?? []).filter((item) => !removed.includes(item));
  })();
  const levelInfo = levelMeta[level];
  const sourceLabel = questionSource === "custom" ? "Custom prompt" : "Original deck";
  const canDeleteCurrent =
    question.length > 0 &&
    question !== EMPTY_PROMPT_MESSAGE &&
    ((questionSource === "custom" && (mode === "truth" ? customTruths : customDares)[level].includes(question)) ||
      (questionSource === "base" && availableBase.includes(question)));

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Level</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {levelOptions.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleLevelChange(id)}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-wide transition-all",
                id === level
                  ? "border-white bg-white text-black shadow-glow"
                  : "border-white/30 text-white/70 hover:border-white hover:text-white",
              )}
            >
              <span>{label}</span>
              <span className="text-lg">{emoji}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["truth", "dare"] as Mode[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleModeChange(option)}
            className={cn(
              "flex-1 min-w-[140px] rounded-full border px-6 py-3 text-base font-semibold uppercase tracking-wide transition-all",
              option === mode
                ? "border-white bg-white text-black shadow-glow"
                : "border-white/30 text-white/70 hover:border-white hover:text-white",
            )}
          >
            {option}
          </button>
        ))}
      </div>

      <GameCard animateKey={animationKey} className="space-y-4 text-left">
        <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/50">
            {mode === "truth" ? "Truth" : "Dare"} · {levelInfo.label} {levelInfo.emoji} · {sourceLabel}
        </p>
          <button
            type="button"
            onClick={handleDeleteCurrent}
            disabled={!canDeleteCurrent}
            aria-label="Remove this prompt from the deck"
            className={cn(
              "rounded-full border px-3 py-1 text-lg transition-colors",
              canDeleteCurrent
                ? "border-white/40 text-white hover:border-white hover:bg-white/10"
                : "cursor-not-allowed border-white/10 text-white/30",
            )}
          >
            🗑️
          </button>
        </div>
        <p className="text-2xl font-medium leading-snug text-white sm:text-3xl">{question}</p>
        <p className="text-xs text-white/40">
          Custom prompts are favored to appear 50% of the time whenever they exist in this level.
        </p>
      </GameCard>

      <div className="blur-card rounded-3xl border border-white/10 p-6 shadow-glow">
        <form onSubmit={handleAddPrompt} className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
              Add your own {levelInfo.label.toLowerCase()} {mode}
            </p>
            <p className="text-xs text-white/40">
              New prompts in this level get a weighted boost, making them pop up faster in the rotation.
            </p>
          </div>

          <textarea
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={`Type a ${levelInfo.label.toLowerCase()} ${mode} prompt...`}
            className="min-h-[96px] w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MainButton
              type="submit"
              variant="solid"
              className="w-full sm:w-auto"
              disabled={inputValue.trim().length === 0}
            >
              Save to deck
            </MainButton>
            <p className="text-xs text-white/50">
              {customCount > 0
                ? `${customCount} custom ${levelInfo.label} ${mode}${customCount > 1 ? "s" : ""} added`
                : "No custom prompts yet"}
            </p>
          </div>
        </form>
      </div>

      <div className="flex justify-center">
        <MainButton variant="solid" onClick={handleRandomize} className="w-full max-w-xs">
          🎲 Randomize
        </MainButton>
      </div>
    </div>
  );
}
