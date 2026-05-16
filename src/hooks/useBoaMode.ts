"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sendMessage } from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export type BoaPhase =
  | "idle"
  | "wake-listening"
  | "greeting"
  | "listening"
  | "processing"
  | "speaking";

// ─── TTS Language Presets ────────────────────────────────────────────────────

type LangCode = "auto" | "en" | "ja" | "zh" | "ko" | "es" | "fr" | "de" | "it" | "pt" | "ru" | "ar" | "hi" | "vi" | "th";

interface TTSConfig {
  lang: string;
  rate: number;
  pitch: number;
  voiceHint?: RegExp;
}

const TTS_PRESETS: Record<string, TTSConfig> = {
  en: { lang: "en-US", rate: 1.0, pitch: 1.1, voiceHint: /zira|samantha|karen|victoria|fiona|sara|emma|aria|jenny|female/i },
  ja: { lang: "ja-JP", rate: 0.85, pitch: 1.0, voiceHint: /kyoko|haruka|nanami|japan|female/i },
  zh: { lang: "zh-CN", rate: 0.9, pitch: 1.0, voiceHint: /huihui|yaoyao|kangkang|chinese|female/i },
  ko: { lang: "ko-KR", rate: 0.9, pitch: 1.0, voiceHint: /hyeryun|korean|female/i },
  es: { lang: "es-ES", rate: 1.0, pitch: 1.0, voiceHint: /helena|laura|elena|spanish|female/i },
  fr: { lang: "fr-FR", rate: 1.0, pitch: 1.0, voiceHint: /julie|hortense|french|female/i },
  de: { lang: "de-DE", rate: 1.0, pitch: 1.0, voiceHint: /hedda|katja|german|female/i },
  it: { lang: "it-IT", rate: 1.0, pitch: 1.0, voiceHint: /bianca|elsa|italian|female/i },
  pt: { lang: "pt-BR", rate: 1.0, pitch: 1.0, voiceHint: /francisca|maria|portuguese|female/i },
  ru: { lang: "ru-RU", rate: 1.0, pitch: 1.0, voiceHint: /irina|russian|female/i },
  ar: { lang: "ar-SA", rate: 0.9, pitch: 1.0, voiceHint: /arabic|female/i },
  hi: { lang: "hi-IN", rate: 0.9, pitch: 1.0, voiceHint: /hindi|female/i },
  vi: { lang: "vi-VN", rate: 1.0, pitch: 1.0, voiceHint: /vietnamese|female/i },
  th: { lang: "th-TH", rate: 0.9, pitch: 1.0, voiceHint: /thai|female/i },
};

// ─── Language Detection ───────────────────────────────────────────────────────

function detectLanguage(text: string): string {
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text)) return "zh";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[àáâãäåæçèéêëìíîïñòóôõöøùúûüýÿ]/i.test(text)) {
    if (/[çèéêëïùûü]/i.test(text)) return "fr";
    if (/[áéíóúüñ¿¡]/i.test(text)) return "es";
    return "fr";
  }
  if (/[äöüß]/i.test(text)) return "de";
  if (/[àáãảạâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return "vi";
  return "en";
}

function getLangConfig(lang: LangCode | string, text: string): TTSConfig {
  const code = lang === "auto" || !lang ? detectLanguage(text) : lang;
  return TTS_PRESETS[code] || TTS_PRESETS["en"];
}

// ─── Voice Selection ─────────────────────────────────────────────────────────

function scoreVoice(voice: SpeechSynthesisVoice, config: TTSConfig): number {
  let score = 0;
  const vl = voice.lang.toLowerCase();
  const target = config.lang.toLowerCase();
  const targetBase = target.split("-")[0];

  // Language match
  if (vl === target) score += 100;
  else if (vl.startsWith(targetBase + "-")) score += 60;
  else if (vl === targetBase) score += 40;

  // Quality (local/neural voices sound dramatically better)
  if (voice.localService) score += 30;
  if (/premium|enhanced|neural|natural|wavenet/i.test(voice.name)) score += 40;

  // Character fit: Boa Hancock = female voice
  if (config.voiceHint?.test(voice.name)) score += 25;
  else if (/female/i.test(voice.name)) score += 10;

  // Deprioritize low-quality cloud voices
  if (/google translate/i.test(voice.name)) score -= 20;

  return score;
}

function selectVoice(voices: SpeechSynthesisVoice[], config: TTSConfig): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const candidates = voices
    .map((v) => ({ voice: v, score: scoreVoice(v, config) }))
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.voice;
}

// ─── Text Chunking ───────────────────────────────────────────────────────────

function chunkText(text: string, maxChunk = 180): string[] {
  if (!text || text.length <= maxChunk) return [text];

  const chunks: string[] = [];
  // Split on sentence boundaries, keeping delimiters in capture group
  const parts = text.split(/([.!?。！？\n]+(?:\s|$))/);

  let current = "";
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i] || "";
    const delim = parts[i + 1] || "";
    const full = sentence + delim;
    if (!full) continue;

    if ((current + full).length > maxChunk && current) {
      chunks.push(current.trim());
      current = full;
    } else {
      current += full;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Hard-split any remaining oversized chunks
  return chunks.flatMap((c) => {
    if (c.length <= maxChunk) return [c];
    const isCJK = /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/.test(c);
    if (isCJK) {
      const out: string[] = [];
      for (let i = 0; i < c.length; i += maxChunk) out.push(c.slice(i, i + maxChunk));
      return out;
    }
    const regex = new RegExp(`.{1,${maxChunk}}(?:\\s|$)`, "g");
    return c.match(regex)?.map((s) => s.trim()).filter(Boolean) || [c];
  });
}

// ─── Improved Speak ───────────────────────────────────────────────────────────

interface SpeakOptions {
  lang?: LangCode;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) {
      resolve();
      return;
    }

    const config = getLangConfig(options.lang || "auto", text);
    const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();
    const voice = selectVoice(voices, config);

    // Cancel previous speech (assistant mode = interruptible)
    window.speechSynthesis.cancel();

    const chunks = chunkText(text);
    if (!chunks.length) {
      resolve();
      return;
    }

    let completed = 0;
    let started = false;
    let resolved = false;

    const tryResolve = () => {
      if (!resolved && completed >= chunks.length) {
        resolved = true;
        options.onEnd?.();
        resolve();
      }
    };

    chunks.forEach((chunk, index) => {
      const utter = new SpeechSynthesisUtterance(chunk);
      utter.lang = voice?.lang || config.lang;
      utter.rate = options.rate ?? config.rate;
      utter.pitch = options.pitch ?? config.pitch;
      utter.volume = options.volume ?? 1;
      if (voice) utter.voice = voice;

      utter.onstart = () => {
        if (!started && index === 0) {
          started = true;
          options.onStart?.();
        }
      };

      utter.onend = () => {
        completed++;
        tryResolve();
      };

      utter.onerror = (e) => {
        const err = (e as any).error;
        // If user called stopSpeaking()/cancel(), resolve immediately
        if (err === "canceled" || err === "interrupted") {
          if (!resolved) {
            resolved = true;
            resolve();
          }
          return;
        }
        completed++;
        tryResolve();
      };

      // First chunk: Chrome gap fix. Rest queue automatically.
      if (index === 0) {
        setTimeout(() => window.speechSynthesis.speak(utter), 100);
      } else {
        window.speechSynthesis.speak(utter);
      }
    });
  });
}

function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ─── Static data ──────────────────────────────────────────────────────────────
const PICKUP_LINES = [
  "You dare wake the Empress? This better be important.",
  "I shall forgive your interruption... because I am beautiful!",
  "Salome, look who finally decided to summon us.",
  "The Pirate Empress is now online. Speak your desire.",
  "Did you miss my presence that much? Of course you did.",
  "You called for me? Kneel and present your request.",
  "My gaze alone can turn you to stone. What do you want?",
  "The Snake Princess is listening. Choose your words wisely."
];

const SILENCE_TIMEOUT_MS = 2000;
const IDLE_TIMEOUT_MS = 8000;

// ─── Preload voices at module level (fixes first-call TTS lag) ───────────────
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined") {
  const load = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomPickupLine() {
  return PICKUP_LINES[Math.floor(Math.random() * PICKUP_LINES.length)];
}

function getSR() {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useBoaMode() {
  const [phase, setPhase] = useState<BoaPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  const phaseRef = useRef<BoaPhase>("idle");
  const activeRef = useRef(false);
  const recRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const txRef = useRef("");
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const abortRef = useRef<AbortController | null>(null); // cancels in-flight API call

  const setPhaseSync = (p: BoaPhase) => { phaseRef.current = p; setPhase(p); };

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // Simple killRec — no Promise, no onend override
  const killRec = () => {
    try { recRef.current?.stop(); } catch (_) { }
    recRef.current = null;
  };

  const makeRec = (continuous: boolean) => {
    const SR = getSR()!;
    const r = new SR();
    r.lang = "en-US,ja-JP,zh-CN,ko-KR,es-ES,fr-FR,de-DE,it-IT,pt-BR,ru-RU,ar-SA,hi-IN,vi-VN,th-TH";
    r.continuous = continuous;
    r.interimResults = true;
    recRef.current = r;
    return r;
  };

  // Forward refs
  const handleUserSaidRef = useRef<(text: string) => void>(() => { });
  const startWakeListenerRef = useRef<() => void>(() => { });
  const stopBoaModeRef = useRef<() => void>(() => { });

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 2 → listen to user question
  // ══════════════════════════════════════════════════════════════════════════════
  const startListening = useCallback(() => {
    if (!activeRef.current) return;
    killRec();

    txRef.current = "";
    setTranscript("");
    setPhaseSync("listening");

    // 150ms gap — gives browser time to release mic before new session
    setTimeout(() => {
      if (!activeRef.current) return;

      const rec = makeRec(true);
      let gotSpeech = false;

      const idleTimer = setTimeout(() => {
        if (!gotSpeech && activeRef.current) killRec();
      }, IDLE_TIMEOUT_MS);

      rec.onresult = (e: any) => {
        gotSpeech = true;
        clearTimeout(idleTimer);
        const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join("");
        txRef.current = t;
        setTranscript(t);
        clearTimer();
        timerRef.current = setTimeout(() => killRec(), SILENCE_TIMEOUT_MS);
      };

      rec.onerror = () => {
        clearTimeout(idleTimer);
        clearTimer();
      };

      rec.onend = () => {
        clearTimeout(idleTimer);
        clearTimer();
        if (!activeRef.current) return;
        const said = txRef.current.trim();
        if (said) {
          handleUserSaidRef.current(said);
        } else {
          startWakeListenerRef.current();
        }
      };

      try { rec.start(); } catch (_) { }
    }, 150);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 3 → API call → speak → back to listening
  // ══════════════════════════════════════════════════════════════════════════════
  const handleUserSaid = useCallback(async (userText: string) => {
    if (!activeRef.current) return;

    if (/^(stop|exit|goodbye|bye)\b/i.test(userText.trim())) {
      stopBoaModeRef.current();
      return;
    }

    setPhaseSync("processing");
    setAiResponse("");
    historyRef.current.push({ role: "user", content: userText });

    // Create a fresh AbortController for this request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const reply = await sendMessage(userText, historyRef.current as any, controller.signal);
      if (!activeRef.current) return;
      historyRef.current.push({ role: "model", content: reply });
      setAiResponse(reply);
      setPhaseSync("speaking");
      await speak(reply);
      if (activeRef.current) startListening();
    } catch (err: any) {
      if (!activeRef.current || err?.name === "AbortError") return;
      await speak("Oops! Something went wrong. Please try again.");
      if (activeRef.current) startListening();
    }
  }, [startListening]);

  useEffect(() => { handleUserSaidRef.current = handleUserSaid; }, [handleUserSaid]);

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 1 → wake word listener
  // ══════════════════════════════════════════════════════════════════════════════
  const startWakeListener = useCallback(() => {
    if (!activeRef.current) return;
    const SR = getSR();
    if (!SR) { alert("Speech recognition not supported. Use Chrome or Edge."); return; }

    killRec();
    setPhaseSync("wake-listening");
    setTranscript("");
    setAiResponse("");

    // 150ms gap — gives browser time to release mic before new session
    setTimeout(() => {
      if (!activeRef.current) return;

      const rec = makeRec(true);
      let triggered = false;

      rec.onresult = async (e: any) => {
        if (triggered) return;

        // Only check LATEST chunk — avoids "boa boa boa" duplicate problem
        const latest = e.results[e.results.length - 1];
        const t = latest[0].transcript.toLowerCase().trim();
        console.log("Wake chunk:", t);

        if (/\b(boa|hancock|hankok|snake lady|snake princess|empress)\b/.test(t)) {
          triggered = true;   // lock — prevents onend from restarting
          killRec();          // stop mic immediately
          setPhaseSync("greeting");
          const line = randomPickupLine();
          setAiResponse(line);
          await speak(line);  // wait for greeting to finish speaking
          if (activeRef.current) startListening();
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === "no-speech") return; // normal, onend handles restart
        if (activeRef.current && !triggered) {
          setTimeout(() => startWakeListenerRef.current(), 500);
        }
      };

      rec.onend = () => {
        // Restart ONLY if wake word was NOT triggered
        if (activeRef.current && phaseRef.current === "wake-listening" && !triggered) {
          setTimeout(() => startWakeListenerRef.current(), 300);
        }
      };

      try { rec.start(); } catch (_) { }
    }, 150);
  }, [startListening]);

  useEffect(() => { startWakeListenerRef.current = startWakeListener; }, [startWakeListener]);

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════
  const startBoaMode = useCallback(() => {
    activeRef.current = true;
    historyRef.current = [];
    startWakeListener();
  }, [startWakeListener]);

  const stopBoaMode = useCallback(() => {
    activeRef.current = false;
    abortRef.current?.abort();   // cancel any in-flight API call
    abortRef.current = null;
    clearTimer();
    stopSpeaking();
    killRec();
    setPhaseSync("idle");
    setTranscript("");
    setAiResponse("");
    historyRef.current = [];
  }, []);

  useEffect(() => { stopBoaModeRef.current = stopBoaMode; }, [stopBoaMode]);

  useEffect(() => () => {
    activeRef.current = false;
    clearTimer();
    window.speechSynthesis?.cancel();
    killRec();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isBoaActive: phase !== "idle",
    phase,
    transcript,
    aiResponse,
    startBoaMode,
    stopBoaMode,
  };
}