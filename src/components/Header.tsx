import { Menu, Mic } from "lucide-react";
import { themeStyles as s } from "../styles/theme";

type HeaderProps = {
  toggleSidebar: () => void;
  onBoaToggle: () => void;
  isBoaActive: boolean;
};

export default function Header({ toggleSidebar, onBoaToggle, isBoaActive }: HeaderProps) {
  return (
    <header style={{ ...s.header, justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
      </div>

      {/* Boa Mode Toggle */}
      <button
        onClick={onBoaToggle}
        title={isBoaActive ? "Exit Boa Mode" : "Activate Boa Voice Mode"}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 18px", borderRadius: "40px", cursor: "pointer",
          fontFamily: "inherit", fontSize: "14px", fontWeight: 600,
          letterSpacing: "0.5px", transition: "all 0.25s ease",
          border: isBoaActive ? "1.5px solid #6366f1" : "1.5px solid #e5e7eb",
          background: isBoaActive
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "transparent",
          color: isBoaActive ? "#fff" : "#6b7280",
          boxShadow: isBoaActive ? "0 0 16px #6366f188" : "none",
        }}
      >
        <Mic size={18} />
        Boa
      </button>
    </header>
  );
}
