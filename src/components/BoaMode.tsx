"use client";

import { useEffect, useRef, useState } from "react";
import { BoaPhase } from "../hooks/useBoaMode";
import { Mic, Ear, MessageCircle, Brain, Sparkles, X } from "lucide-react";

type BoaModeProps = {
  phase: BoaPhase;
  transcript: string;
  aiResponse: string;
  onExit: () => void;
};

const PHASE_LABELS: Record<BoaPhase, string> = {
  idle: "",
  "wake-listening": 'Say "Boa" or "Hancock" to wake me...',
  greeting: "Greetings!",
  listening: "Listening...",
  processing: "Thinking...",
  speaking: "Speaking...",
};

const PHASE_ACCENT: Record<BoaPhase, string> = {
  idle: "#0b57d0",
  "wake-listening": "#9aa0a6",
  greeting: "#0b57d0",
  listening: "#0b57d0",
  processing: "#fbbc05",
  speaking: "#34a853",
};

const PHASE_ICON: Record<BoaPhase, React.ReactNode> = {
  idle: <Mic size={36} />,
  "wake-listening": <Mic size={36} />,
  greeting: <Sparkles size={36} />,
  listening: <Ear size={36} />,
  processing: <Brain size={36} />,
  speaking: <MessageCircle size={36} />,
};

export default function BoaMode({ phase, transcript, aiResponse, onExit }: BoaModeProps) {
  const [orbScale, setOrbScale] = useState(1);
  const responseRef = useRef<HTMLDivElement>(null);
  const accent = PHASE_ACCENT[phase];
  const label = PHASE_LABELS[phase];
  const icon = PHASE_ICON[phase];

  // Pulse orb on active audio phases
  useEffect(() => {
    const active = phase === "listening" || phase === "speaking" || phase === "greeting";
    if (!active) { setOrbScale(1); return; }
    let t = 0;
    const iv = setInterval(() => { t += 0.07; setOrbScale(1 + 0.12 * Math.sin(t)); }, 40);
    return () => clearInterval(iv);
  }, [phase]);

  // Auto-scroll response card to bottom when new text arrives
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [aiResponse]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--bg-main)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Google Sans', arial, sans-serif",
      overflow: "hidden",       // nothing leaks outside
    }}>

      {/* ── TOP BAR (fixed height) ───────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: "1px solid var(--border-color)",
        background: "#fff",
      }}>
        {/* Logo */}
        <div style={{ fontSize: "20px", fontWeight: 500, color: "#5f6368", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ color: "#4285f4", fontWeight: 600 }}>M</span>
          <span style={{ color: "#ea4335", fontWeight: 600 }}>y</span>
          <span style={{ color: "#4285f4", fontWeight: 600 }}> - </span>
          <span style={{ color: "#fbbc05", fontWeight: 600 }}>A</span>
          <span style={{ color: "#4285f4", fontWeight: 600 }}>I</span>
        </div>

        {/* Badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#f0f4f9", borderRadius: "40px",
          padding: "7px 18px",
          border: "1px solid var(--border-color)",
          fontSize: "14px", fontWeight: 600, color: "#1f1f1f",
        }}>
          <Mic size={15} color="#0b57d0" /> Boa Mode
        </div>

        {/* Exit — with abort label */}
        <button
          onClick={onExit}
          title="Stop & Exit Boa Mode"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 18px", borderRadius: "40px", cursor: "pointer",
            fontFamily: "inherit", fontSize: "14px", fontWeight: 500,
            border: "1px solid #fecdd3",
            background: "transparent", color: "#dc2626",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={15} strokeWidth={2.5} />
          Stop & Exit
        </button>
      </div>

      {/* ── ORB + STATUS (fixed center strip) ───────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "28px 24px 20px",
        gap: "16px",
      }}>
        {/* Orb */}
        <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {[1.6, 1.3].map((s, i) => (
            <div key={i} style={{
              position: "absolute", width: "120px", height: "120px", borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}${i === 0 ? "10" : "20"} 0%, transparent 70%)`,
              transform: `scale(${orbScale * s})`,
              transition: "transform 0.04s linear, background 0.4s ease",
            }} />
          ))}
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 2px 20px ${accent}44`,
            transform: `scale(${orbScale})`,
            transition: "transform 0.04s linear, box-shadow 0.4s ease, color 0.4s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accent,
            border: `2px solid ${accent}33`,
          }}>
            {icon}
          </div>
        </div>

        {/* Phase label */}
        <p style={{
          margin: 0, fontSize: "18px", fontWeight: 400,
          color: phase === "wake-listening" ? "#9aa0a6" : "var(--text-primary)",
          transition: "color 0.3s", textAlign: "center", letterSpacing: "0.2px",
        }}>
          {label}
        </p>

        {/* Processing dots */}
        {phase === "processing" && (
          <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#fbbc05",
                animation: `boaDot 1.2s ${i * 0.2}s infinite ease-in-out`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* ── SCROLLABLE CONTENT AREA ──────────────────────────────────── */}
      <div style={{
        flex: 1,                // takes all remaining vertical space
        overflowY: "auto",     // scrolls independently when content is tall
        padding: "0 24px 32px",
        display: "flex", flexDirection: "column", gap: "12px",
        alignItems: "center",
      }}>
        <div style={{ width: "100%", maxWidth: "640px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* User transcript */}
          {transcript && (
            <div style={{
              background: "var(--bg-user)", borderRadius: "20px",
              padding: "14px 18px", border: "1px solid var(--border-color)",
            }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 600, color: "#9aa0a6", letterSpacing: "0.8px", textTransform: "uppercase" }}>You</p>
              <p style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)", lineHeight: 1.55 }}>{transcript}</p>
            </div>
          )}

          {/* AI response — scrollable internally if absurdly long, auto-scrolled to bottom */}
          {aiResponse && phase !== "wake-listening" && (
            <div style={{
              background: "var(--bg-ai)", borderRadius: "20px",
              padding: "14px 18px", border: "1px solid var(--border-color)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#0b57d0", letterSpacing: "0.8px", textTransform: "uppercase" }}>Boa Hancock</p>
                {phase === "speaking" && (
                  <span style={{ fontSize: "11px", color: "#34a853", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "6px", height: "6px", background: "#34a853", borderRadius: "50%", display: "inline-block", animation: "boaPulse 1s infinite" }} />
                    Speaking
                  </span>
                )}
              </div>
              {/* Inner scroll cap: if a single response is insanely long */}
              <div
                ref={responseRef}
                style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}
              >
                <p style={{ margin: 0, fontSize: "16px", color: "var(--text-primary)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{aiResponse}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes boaDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
        @keyframes boaPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
