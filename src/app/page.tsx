"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { themeStyles as s } from "../styles/theme";
import { FormData, Message } from "../types";
import { sendMessage } from "../services/api";
import { useChats } from "../hooks/useChats";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useBoaMode } from "../hooks/useBoaMode";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ChatArea from "../components/ChatArea";
import MessageInput from "../components/MessageInput";
import VoiceModal from "../components/VoiceModal";
import BoaMode from "../components/BoaMode";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isBoaActive, phase, transcript, aiResponse, startBoaMode, stopBoaMode } = useBoaMode();

  const handleBoaToggle = () => {
    if (isBoaActive) stopBoaMode();
    else startBoaMode();
  };
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const { control, handleSubmit, reset, watch, setValue } = useForm<FormData>({ defaultValues: { message: "" } });
  const watchMessage = watch("message");

  const {
    chats,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    updateChatMessages,
    activeChat,
  } = useChats();

  const handleSpeechResult = (text: string) => {
    setValue("message", text);
  };

  const {
    isListening,
    showVoiceModal,
    voiceTranscript,
    toggleListening,
    cancelListening,
    confirmListening,
    resetVoiceState
  } = useSpeechRecognition(handleSpeechResult, watchMessage);

  /* ── Scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId]);

  async function onSubmitForm() {
    const msg = watchMessage.trim();
    if (!msg || isLoading || !currentChatId || !activeChat) return;

    resetVoiceState();

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    reset({ message: "" });
    setIsLoading(true);

    const history = [...activeChat.messages, userMsg];
    const title = activeChat.messages.length === 0 ? msg.slice(0, 32) + (msg.length > 32 ? "…" : "") : activeChat.title;

    updateChatMessages(currentChatId, title, history);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const responseContent = await sendMessage(msg, activeChat.messages, controller.signal);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "model", content: responseContent, isNew: true };
      
      updateChatMessages(currentChatId, title, [...history, aiMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      const errorContent = err.message && err.message !== "Network error" && err.message !== "Failed to fetch" 
        ? err.message 
        : "Sorry, I couldn't reach the server. Make sure the backend is running.";
      const errMsg: Message = { id: (Date.now() + 1).toString(), role: "model", content: errorContent, isNew: true };
      updateChatMessages(currentChatId, title, [...history, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  const canSend = watchMessage.trim().length > 0 && !isLoading;

  return (
    <div style={s.root}>
      {showVoiceModal && (
        <VoiceModal
          isListening={isListening}
          voiceTranscript={voiceTranscript}
          onCancel={cancelListening}
          onConfirm={confirmListening}
        />
      )}

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

      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        createNewChat={createNewChat}
        setCurrentChatId={setCurrentChatId}
        setIsSidebarOpen={setIsSidebarOpen}
        deleteChat={deleteChat}
        isOpen={isSidebarOpen}
      />

      {/* Boa Voice Mode Overlay */}
      {isBoaActive && (
        <BoaMode
          phase={phase}
          transcript={transcript}
          aiResponse={aiResponse}
          onExit={stopBoaMode}
        />
      )}

      <div style={s.main}>
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onBoaToggle={handleBoaToggle}
          isBoaActive={isBoaActive}
        />
        
        <ChatArea
          currentChat={activeChat}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />

        <MessageInput
          control={control}
          watchMessage={watchMessage}
          isLoading={isLoading}
          canSend={canSend}
          onSubmit={handleSubmit(onSubmitForm)}
          onToggleListening={toggleListening}
          onStop={handleStop}
        />
      </div>
    </div>
  );
}
