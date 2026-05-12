import { Mic } from "lucide-react";

type VoiceModalProps = {
  isListening: boolean;
  voiceTranscript: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function VoiceModal({ isListening, voiceTranscript, onCancel, onConfirm }: VoiceModalProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
    }}>
      <div style={{
        background: "#fff", width: "90%", maxWidth: "500px", borderRadius: "24px",
        padding: "32px", boxShadow: "0 24px 40px rgba(0,0,0,0.1)",
        display: "flex", flexDirection: "column", gap: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "20px", fontWeight: 500, color: "var(--text-primary)" }}>
          <div className={isListening ? "animate-pulse" : ""} style={{
            background: isListening ? "#fce8e6" : "#f1f3f4",
            color: isListening ? "#ea4335" : "#5f6368",
            padding: "12px", borderRadius: "50%", display: "flex"
          }}>
            <Mic size={28} />
          </div>
          {isListening ? "Listening..." : "Stopped"}
        </div>
        
        <div style={{
          fontSize: "18px", color: voiceTranscript ? "var(--text-primary)" : "#9aa0a6",
          minHeight: "80px", maxHeight: "200px", overflowY: "auto",
          padding: "16px", background: "#f8f9fa", borderRadius: "16px",
          lineHeight: 1.5
        }}>
          {voiceTranscript || "Speak now..."}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button 
            type="button"
            onClick={onCancel}
            style={{ padding: "10px 24px", border: "none", background: "transparent", color: "#5f6368", fontWeight: 500, cursor: "pointer", borderRadius: "24px" }}
            className="hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            style={{ padding: "10px 24px", border: "none", background: "#1a73e8", color: "#fff", fontWeight: 500, cursor: "pointer", borderRadius: "24px" }}
            className="hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
