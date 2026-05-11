"use client";

import { useState, useEffect, useRef } from "react";
import {
  Menu, Search, Mic, Image as ImageIcon, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "highlight.js/styles/github.css"; // ya github-dark
import "katex/dist/katex.min.css";


type Message = { id: string; role: "user" | "model"; content: string };
type Chat = { id: string; title: string; messages: Message[]; updatedAt: number };
type FormData = { message: string };

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/chat/";

  const { control, handleSubmit, reset, watch } = useForm<FormData>({ defaultValues: { message: "" } });
  const watchMessage = watch("message");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ── Persist chats ── */
  useEffect(() => {
    const saved = localStorage.getItem("my-ai-chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    } else { createNewChat(); }
  }, []);

  useEffect(() => {
    if (chats.length > 0) localStorage.setItem("my-ai-chats", JSON.stringify(chats));
  }, [chats]);

  /* ── Scroll ── */
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chats, currentChatId]);

  const currentChat = chats.find(c => c.id === currentChatId);

  function createNewChat() {
    const isNewChatExist = chats.some(chat => chat.messages.length === 0);
    if (isNewChatExist) return;

    const nc: Chat = { id: Date.now().toString(), title: "New search", messages: [], updatedAt: Date.now() };
    setChats(prev => [nc, ...prev]);
    setCurrentChatId(nc.id);
    if (typeof window !== "undefined" && window.innerWidth < 768) setIsSidebarOpen(false);
  }

  function deleteChat(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (currentChatId === id) setCurrentChatId(updated.length > 0 ? updated[0].id : null);
    if (updated.length === 0) { localStorage.removeItem("my-ai-chats"); createNewChat(); }
  }

  async function onSubmit(data: FormData) {
    const msg = data.message.trim();
    if (!msg || isLoading || !currentChatId) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    reset({ message: "" });
    setIsLoading(true);

    const active = chats.find(c => c.id === currentChatId);
    if (!active) return;

    const history = [...active.messages, userMsg];
    const title = active.messages.length === 0 ? msg.slice(0, 32) + (msg.length > 32 ? "…" : "") : active.title;

    setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: history, title, updatedAt: Date.now() } : c));

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history: active.messages.slice(-5) }),
      });
      if (!res.ok) throw new Error("Network error");
      const json = await res.json();
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "model", content: json.response || json.error || "Error." };
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, aiMsg], updatedAt: Date.now() } : c));
    } catch {
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: "model", content: "Sorry, I couldn't reach the server. Make sure the backend is running." };
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, errMsg], updatedAt: Date.now() } : c));
    } finally { setIsLoading(false); }
  }

  /* ─────── STYLES (Google Search AI Overview Light Theme) ─────── */
  const s = {
    root: {
      display: "flex", height: "100dvh", overflow: "hidden",
      background: "var(--bg-main)", color: "var(--text-primary)",
      fontFamily: "'Google Sans', arial, sans-serif",
    } as React.CSSProperties,

    sidebar: {
      position: "fixed" as const, top: 0, left: 0, bottom: 0, zIndex: 40,
      width: "280px",
      transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
      background: "var(--bg-sidebar)",
      display: "flex", flexDirection: "column" as const,
      transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
      boxShadow: isSidebarOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
    },

    sidebarInner: {
      width: "280px", minWidth: "280px",
      height: "100%", display: "flex", flexDirection: "column" as const,
      padding: "20px 16px",
    },

    newBtn: {
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 16px", background: "#fff",
      border: "1px solid var(--border-color)", borderRadius: "24px",
      fontSize: "14px", fontWeight: 500, color: "var(--text-primary)",
      cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      marginBottom: "24px"
    },

    chatList: { flex: 1, overflowY: "auto" as const, display: "flex", flexDirection: "column" as const, gap: "4px" },

    chatItem: (active: boolean): React.CSSProperties => ({
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px", borderRadius: "24px", cursor: "pointer",
      background: active ? "#e8eaed" : "transparent",
      color: active ? "#202124" : "#5f6368",
      transition: "background 0.2s",
      gap: "12px",
    }),

    main: {
      flex: 1, display: "flex", flexDirection: "column" as const,
      height: "100%", minWidth: 0, background: "#fff"
    },

    header: {
      display: "flex", alignItems: "center", padding: "16px 24px", gap: "16px",
    },

    logo: {
      fontSize: "22px", fontWeight: 500, color: "#5f6368", display: "flex", alignItems: "center", gap: "6px"
    },

    chatArea: {
      flex: 1, overflowY: "auto" as const, padding: "0 24px 24px",
    },

    chatInner: { maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" },

    // Google Search User Query
    userQueryBox: {
      fontSize: "22px", fontWeight: 400, color: "var(--text-primary)",
      marginBottom: "20px", marginTop: "24px", padding: "0 12px"
    },

    // AI Overview Box
    aiOverview: {
      background: "var(--bg-ai)",
      borderRadius: "24px",
      padding: "24px",
      marginBottom: "32px",
    },

    aiHeader: {
      display: "flex", alignItems: "center", gap: "10px",
      marginBottom: "16px", fontSize: "18px", fontWeight: 400, color: "var(--text-primary)"
    },

    searchWrap: {
      maxWidth: "800px", margin: "0 auto", width: "100%",
      padding: "16px 24px calc(24px + env(safe-area-inset-bottom))",
      flexShrink: 0
    },

    searchBar: {
      display: "flex", alignItems: "center", gap: "12px",
      background: "#fff", borderRadius: "32px",
      padding: "12px 16px 12px 24px",
    },

    searchInput: {
      flex: 1, border: "none", outline: "none",
      fontSize: "16px", background: "transparent",
      fontFamily: "inherit", color: "var(--text-primary)",
      resize: "none" as const, maxHeight: "150px", overflowY: "auto" as const,
      padding: "4px 0"
    },

    iconBtn: {
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "40px", height: "40px", borderRadius: "50%",
      border: "none", background: "transparent", cursor: "pointer",
      color: "#5f6368"
    },
    
    sendBtn: (active: boolean): React.CSSProperties => ({
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "40px", height: "40px", borderRadius: "50%",
      border: "none", cursor: active ? "pointer" : "default",
      background: active ? "var(--bg-ai)" : "transparent",
      color: active ? "var(--accent-blue)" : "#bdc1c6",
    })
  };

  const canSend = watchMessage.trim().length > 0 && !isLoading;

  return (
    <div style={s.root}>
      {/* Overlay */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          zIndex: 35, opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? "auto" : "none",
          transition: "opacity 300ms ease"
        }}
      />

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarInner}>
          <button style={s.newBtn} onClick={createNewChat}>
            <Plus size={20} color="#ea4335" />
            New search
          </button>

          <div style={{ fontSize: "12px", fontWeight: 500, color: "#5f6368", marginBottom: "12px", paddingLeft: "12px" }}>
            Recent searches
          </div>

          <div style={s.chatList}>
            {[...chats].sort((a, b) => b.updatedAt - a.updatedAt).map(chat => (
              <div
                key={chat.id}
                style={s.chatItem(currentChatId === chat.id)}
                onClick={() => { setCurrentChatId(chat.id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className="group"
              >
                <MessageSquare size={16} />
                <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14px" }}>
                  {chat.title}
                </span>
                <button
                  onClick={e => deleteChat(e, chat.id)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9aa0a6" }}
                  className="hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={s.main}>
        <header style={s.header}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#5f6368", padding: "8px", borderRadius: "50%", display: "flex" }}
            className="hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          
          <div style={s.logo}>
            <span style={{ color: "#4285f4", fontWeight: 600 }}>M</span>
            <span style={{ color: "#ea4335", fontWeight: 600 }}>y</span>
            <span style={{ color: "#4285f4", fontWeight: 600 }}> - </span>
            <span style={{ color: "#fbbc05", fontWeight: 600 }}>A</span>
            <span style={{ color: "#4285f4", fontWeight: 600 }}>I</span>
          </div>
        </header>

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
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeKatex]}
                        >
                          {m.content}
                        </ReactMarkdown>
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
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div style={s.searchWrap}>
          <form onSubmit={handleSubmit(onSubmit)}>
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
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(onSubmit)(); }
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
                <button type="button" style={s.iconBtn} className="hover:bg-gray-100">
                  <Mic size={20} />
                </button>
                <button type="button" style={s.iconBtn} className="hover:bg-gray-100">
                  <ImageIcon size={20} />
                </button>
                {watchMessage.trim().length > 0 && (
                  <button type="submit" disabled={!canSend} style={s.sendBtn(canSend)}>
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
