import { Search, Mic, Send, Loader2, Square } from "lucide-react";
import { Control, Controller } from "react-hook-form";
import { themeStyles as s } from "../styles/theme";
import { FormData } from "../types";

type MessageInputProps = {
  control: Control<FormData>;
  watchMessage: string;
  isLoading: boolean;
  canSend: boolean;
  onSubmit: () => void;
  onToggleListening: () => void;
  onStop: () => void;
};

export default function MessageInput({ control, watchMessage, isLoading, canSend, onSubmit, onToggleListening, onStop }: MessageInputProps) {
  return (
    <div style={s.searchWrap}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div style={s.searchBar} className="search-bar-wrap">
          <Search size={22} color="#9aa0a6" />
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={1}
                placeholder="Ask anything..."
                style={s.searchInput}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    onSubmit(); 
                  }
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 150) + "px";
                }}
              />
            )}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button 
              type="button" 
              onClick={onToggleListening}
              style={s.iconBtn} 
              className="hover:bg-gray-100"
              title="Voice input"
            >
              <Mic size={20} />
            </button>
            {isLoading ? (
              <button type="button" onClick={onStop} style={s.sendBtn(true)} title="Stop generating">
                <Square size={16} fill="currentColor" />
              </button>
            ) : watchMessage.trim().length > 0 ? (
              <button type="submit" disabled={!canSend} style={s.sendBtn(canSend)} title="Send message">
                <Send size={18} />
              </button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
