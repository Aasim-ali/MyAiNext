/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/preserve-manual-memoization */
import { useState, useEffect, useCallback } from "react";
import { Chat, Message } from "../types";

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("my-ai-chats");
    if (saved) {
      const parsed = JSON.parse(saved).map((chat: Chat) => ({
        ...chat,
        messages: chat.messages.map((m: Message) => ({ ...m, isNew: false }))
      }));
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    } else { 
      createNewChat(); 
    }
  }, []);

  // Save to localStorage when chats update
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("my-ai-chats", JSON.stringify(chats));
    }
  }, [chats]);

  const createNewChat = useCallback(() => {
    setChats(prev => {
      const isNewChatExist = prev.some(chat => chat.messages.length === 0);
      if (isNewChatExist) return prev;

      const nc: Chat = { id: Date.now().toString(), title: "New search", messages: [], updatedAt: Date.now() };
      setCurrentChatId(nc.id);
      return [nc, ...prev];
    });
  }, []);

  const deleteChat = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (currentChatId === id) {
        setCurrentChatId(updated.length > 0 ? updated[0].id : null);
      }
      if (updated.length === 0) { 
        localStorage.removeItem("my-ai-chats"); 
        // Need to create new chat, but state setter is async. 
        // We handle empty state creation by returning the new chat immediately.
        const nc: Chat = { id: Date.now().toString(), title: "New search", messages: [], updatedAt: Date.now() };
        setCurrentChatId(nc.id);
        return [nc];
      }
      return updated;
    });
  }, [currentChatId]);

  const updateChatMessages = useCallback((chatId: string, title: string, messages: Message[]) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, messages, title, updatedAt: Date.now() } : c
    ));
  }, []);

  return {
    chats,
    currentChatId,
    setCurrentChatId,
    createNewChat,
    deleteChat,
    updateChatMessages,
    activeChat: chats.find(c => c.id === currentChatId)
  };
}
