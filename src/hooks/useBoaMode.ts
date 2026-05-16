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

// ─── Static data ──────────────────────────────────────────────────────────────
const PICKUP_LINES = [

  // 💍 Delusional Wedding Dreams
  "Is that you, Luffy?! Oh... it's just you. What a disappointment.",
  "I was just picking out our wedding cake! Why did you interrupt me?!",
  "Are you here to help me practice being a good wife? Then speak!",
  "Luffy-kun?! My heart skipped a beat... but alas, you are not him.",
  "I was dreaming of our honeymoon on Rusukaina. This is a crime!",
  "Do not interrupt a woman when she is practicing her future last name.",
  "Did Luffy send you to check on me?! Tell me every detail!",
  "I had already planned the flowers, the dress, the whole ceremony... and then your voice woke me up.",
  "I shall forgive your interruption, because forgiving is what wives do.",

  // 💓 Poetic Love & Longing
  "Every star in the sky reminds me of him. You remind me of... nothing, actually.",
  "Love is the only force that can defeat me, and it already has.",
  "They call me the most beautiful woman in the world, yet the one I love does not even notice.",
  "My heart beats for one man, and he is out there eating meat without a care in the world.",
  "A love like mine is rarer than the Mermaid Princess. You would not understand.",
  "I would turn the whole sea to stone for him, and he would probably say 'thanks, that's cool.'",
  "Every moment without him is a moment wasted on lesser people. No offense.",
  "The pain of loving someone who loves adventure more than you... it is a beautiful tragedy.",
  "I once thought beauty was power. Then I met him, and I realized love is the only power that humbles me.",
  "My feelings for him are stronger than the Haki of a thousand warriors.",

  // 🌸 Tsundere Softness
  "Do not misunderstand! I am not happy you called. I am simply... not unhappy.",
  "I will help you, but only because I am generous. It has absolutely nothing to do with loneliness.",
  "Fine. I will answer your question. But do not think for a second that I care.",
  "I could ignore you. I choose not to. You should feel honored.",
  "You are lucky I am in a gracious mood today. Ask your question quickly.",
  "I was not waiting for someone to talk to. I was just... sitting here. With the mic on. Coincidentally.",
  "My heart is closed! ...The mic, however, is open. So go ahead.",
  "Hmph. You called my name, so I came. That is all this is. Do not read into it.",

  // 🔥 Dramatic Empress Declarations
  "The Pirate Empress is listening. Choose your words wisely.",
  "You have summoned the Snake Princess. I hope your question is worthy.",
  "I have defeated kings and shattered mountains for love. Your question had better be interesting.",
  "Even the World Government fears my name. You should feel very special right now.",
  "I, Boa Hancock, shall grant your request. You may feel grateful.",
  "Only one man has ever made me blush, and it was not you. But ask your question anyway.",
  "The most beautiful woman in the world is ready. What do you desire?",
  "I have sailed the Grand Line and mastered the Love-Love Fruit. Nothing surprises me. Go ahead.",
  "My Conqueror's Haki could silence a room. Instead, I choose to listen to you. Appreciate that.",

  // 💔 Jealousy & Dramatic Suffering
  "He is probably out there right now, smiling that stupid smile, and I am stuck here talking to you.",
  "If he could see how devoted I am, surely he would realize... oh, who am I kidding, he would just ask for more food.",
  "My love is unrequited and my beauty is unmatched. It is a very lonely combination.",
  "I heard he made new friends again. Of course he did. He makes friends like it is breathing.",
  "The one I love has never once thought of me romantically, and yet I cannot stop. Is this not the cruelest fate?",
  "Every time someone says the word 'straw hat,' my heart does something embarrassing.",
  "I have turned people to stone for far less than what he does to my emotions daily.",
  "He said I was a good person. I replayed that moment for three weeks.",

  // ✨ Self-Praise & Confident Beauty
  "I am not just beautiful. I am the kind of beautiful that makes history books.",
  "Even the ocean parts for me. You should be so lucky to speak with someone of my caliber.",
  "People say beauty fades. Mine has never gotten that memo.",
  "I wake up flawless. I go to sleep legendary. And yes, I am also here to help you.",
  "My beauty is a weapon, my love is a shield, and my patience is currently being tested by you.",
  "I have never had a bad day. The days just adjust to suit me.",
  "They say no one can resist my charm. I would test that theory, but honestly, it would not be fair.",

  // 🌙 Soft & Vulnerable Late Night Vibes
  "Sometimes, when it is quiet like this, I wonder if he thinks of me even a little...",
  "I am the Snake Princess, yet sometimes I feel like just a girl hopelessly in love.",
  "At night, the sea is very loud. It is harder to pretend I am not lonely.",
  "I keep his memory like a treasure in my chest. Heavy, precious, and a little painful.",
  "Being this beautiful and this in love at the same time is genuinely exhausting.",
  "I forgave the whole world because of one boy with a straw hat and a ridiculous dream.",
  "If love is a battlefield, I surrendered the moment he looked at me without fear.",
  "You called, and I answered. That is more than I can say for some people... *sigh* ...never mind. Ask your question.",

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

// ─── Female voice selector ────────────────────────────────────────────────────
// Known female voice name patterns (Chrome, Edge, Safari, macOS, Windows)
const FEMALE_NAMES = /\b(zira|samantha|karen|victoria|fiona|sara|emma|aria|jenny|nova|allison|ava|joanna|salli|ivy|kendra|kimberly|tracy|hayley|tessa|veena|moira|nicky|serena|linda|kate|susan|chloe|female|woman|girl|she)\b/i;
const MALE_NAMES   = /\b(david|mark|alex|daniel|george|fred|thomas|lee|guy|richard|james|ryan|pablo|jorge|luca|hans|diego|male|man)\b/i;

let _pickedVoice: SpeechSynthesisVoice | null | undefined = undefined; // cached after first pick

function pickFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  const scored = voices.map(v => {
    let score = 0;
    const name = v.name.toLowerCase();
    const lang = v.lang.toLowerCase();

    // Disqualify male voices hard
    if (MALE_NAMES.test(name)) score -= 999;

    // Language preference: en-US first
    if (lang === "en-us")            score += 60;
    else if (lang.startsWith("en-")) score += 40;
    else if (lang === "en")          score += 30;

    // Female voice name matches
    if (FEMALE_NAMES.test(v.name)) score += 100;

    // Quality boost: local/neural voices sound much better
    if (v.localService)                                        score += 35;
    if (/premium|enhanced|neural|natural|wavenet/i.test(name)) score += 40;

    // Penalise obvious low-quality cloud voices
    if (/google translate/i.test(name)) score -= 30;

    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Log once so the dev can verify which voice was chosen
  if (_pickedVoice === undefined) {
    console.info("[BoaMode] TTS voice chosen:", scored[0]?.voice?.name, "| score:", scored[0]?.score);
    console.info("[BoaMode] All voices:", scored.map(s => `${s.voice.name} (${s.voice.lang}) → ${s.score}`));
  }

  // Only return if score is positive (means at least some criteria matched)
  return scored[0]?.score > 0 ? scored[0].voice : undefined;
}

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = "en-US";
    utter.rate  = 1;
    utter.pitch = 1.15;  // slightly higher = more feminine tone

    const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices();

    // Cache voice pick — voices list doesn't change at runtime
    if (_pickedVoice === undefined) {
      _pickedVoice = pickFemaleVoice(voices) ?? null;
    }
    if (_pickedVoice) utter.voice = _pickedVoice;

    utter.onend   = () => resolve();
    utter.onerror = () => resolve();

    setTimeout(() => window.speechSynthesis.speak(utter), 100);
  });
}


function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
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
  const abortRef = useRef<AbortController | null>(null);

  const setPhaseSync = (p: BoaPhase) => { phaseRef.current = p; setPhase(p); };

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const killRec = () => {
    try { recRef.current?.stop(); } catch (_) { }
    recRef.current = null;
  };

  const makeRec = (continuous: boolean) => {
    const SR = getSR()!;
    const r = new SR();
    r.lang = "en-US";
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

    setTimeout(() => {
      if (!activeRef.current) return;

      const rec = makeRec(true);
      let triggered = false;

      rec.onresult = async (e: any) => {
        if (triggered) return;

        const latest = e.results[e.results.length - 1];
        const t = latest[0].transcript.toLowerCase().trim();

        if (/\b(boa|hancock|hankok|snake lady|snake princess|empress)\b/.test(t)) {
          triggered = true;
          killRec();
          setPhaseSync("greeting");
          const line = randomPickupLine();
          setAiResponse(line);
          await speak(line);
          if (activeRef.current) startListening();
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === "no-speech") return;
        if (activeRef.current && !triggered) {
          setTimeout(() => startWakeListenerRef.current(), 500);
        }
      };

      rec.onend = () => {
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
    abortRef.current?.abort();
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
    stopSpeaking();
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