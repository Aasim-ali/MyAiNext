import { Menu } from "lucide-react";
import { themeStyles as s } from "../styles/theme";

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  return (
    <header style={s.header}>
      <button
        onClick={toggleSidebar}
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
  );
}
