import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Chat } from "../types";
import { themeStyles as s } from "../styles/theme";

export default function Sidebar({
    chats,
    currentChatId,
    createNewChat,
    setCurrentChatId,
    setIsSidebarOpen,
    deleteChat,
    isOpen
}: {
    chats: Chat[];
    currentChatId: string | null;
    createNewChat: () => void;
    setCurrentChatId: (id: string) => void;
    setIsSidebarOpen: (open: boolean) => void;
    deleteChat: (e: React.MouseEvent, id: string) => void;
    isOpen: boolean;
}) {
    return (
        <aside style={s.sidebar(isOpen)}>
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
    );
}