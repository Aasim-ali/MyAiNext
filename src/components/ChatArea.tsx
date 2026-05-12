import { Sparkles } from "lucide-react";
import MarkdownRenderer from "./Markdown";
import { Chat } from "../types";
import { themeStyles as s } from "../styles/theme";
import React from "react";

type ChatAreaProps = {
  currentChat?: Chat;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
};

export default function ChatArea({ currentChat, isLoading, messagesEndRef }: ChatAreaProps) {
  return (
    <div style={s.chatArea}>
      <div style={s.chatInner}>
        {currentChat?.messages.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "15vh" }}>
            <div style={{ fontSize: "42px", fontWeight: 500, marginBottom: "32px", display: "flex", justifyContent: "center", gap: "4px" }}>
              <span style={{ color: "#4285f4" }}>M</span>
              <span style={{ color: "#ea4335" }}>y</span>
              <span style={{ color: "#4285f4" }}> - </span>
              <span style={{ color: "#fbbc05" }}>A</span>
              <span style={{ color: "#4285f4" }}>I</span>
            </div>
          </div>
        ) : (
          currentChat?.messages.map(m => (
            <div key={m.id}>
              {m.role === "user" ? (
                <div style={s.userQueryBox} className="text-right">
                  {m.content}
                </div>
              ) : (
                <div style={s.aiOverview}>
                  <div style={s.aiHeader}>
                    <Sparkles size={22} color="#1a73e8" />
                    AI Overview
                  </div>
                  <div className="prose">
                    <MarkdownRenderer content={m.content} animate={m.isNew} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div style={s.aiOverview}>
            <div style={s.aiHeader}>
              <Sparkles size={22} color="#1a73e8" className="animate-pulse" />
              Generating...
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <div className="w-2 h-2 rounded-full bg-[#4285f4] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[#ea4335] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[#34a853] animate-bounce" style={{ animationDelay: "300ms" }}></div>
              <div className="w-2 h-2 rounded-full bg-[#fbbc05] animate-bounce" style={{ animationDelay: "450ms" }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef as React.LegacyRef<HTMLDivElement>} />
      </div>
    </div>
  );
}
