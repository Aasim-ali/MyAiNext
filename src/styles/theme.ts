export const themeStyles = {
  root: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    background: "var(--bg-main)",
    color: "var(--text-primary)",
    fontFamily: "'Google Sans', arial, sans-serif",
  } as React.CSSProperties,

  sidebar: (isOpen: boolean): React.CSSProperties => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
    width: "280px",
    background: "var(--bg-sidebar)",
    display: "flex",
    flexDirection: "column" as const,
    transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease",
    overflow: "hidden",
    transform: isOpen ? "translateX(0)" : "translateX(-100%)",
    boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.15)" : "none",
  }),

  sidebarInner: {
    width: "280px",
    minWidth: "280px",
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    padding: "20px 16px",
  },

  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "#fff",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    marginBottom: "24px",
  },

  chatList: {
    flex: 1,
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },

  chatItem: (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: "24px",
    cursor: "pointer",
    background: active ? "#e8eaed" : "transparent",
    color: active ? "#202124" : "#5f6368",
    transition: "background 0.2s",
    gap: "12px",
  }),

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    minWidth: 0,
    background: "#fff",
  },

  header: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    gap: "16px",
  },

  logo: {
    fontSize: "22px",
    fontWeight: 500,
    color: "#5f6368",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  chatArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "0 24px 24px",
  },

  chatInner: {
    maxWidth: "800px",
    margin: "0 auto",
    paddingBottom: "40px",
  },

  userQueryBox: {
    fontSize: "22px",
    fontWeight: 400,
    color: "var(--text-primary)",
    marginBottom: "20px",
    marginTop: "24px",
    padding: "0 12px",
  },

  aiOverview: {
    background: "var(--bg-ai)",
    borderRadius: "24px",
    padding: "24px",
    marginBottom: "32px",
  },

  aiHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: 400,
    color: "var(--text-primary)",
  },

  searchWrap: {
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    padding: "16px 24px calc(24px + env(safe-area-inset-bottom))",
    flexShrink: 0,
  },

  searchBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    borderRadius: "32px",
    padding: "12px 16px 12px 24px",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "16px",
    background: "transparent",
    fontFamily: "inherit",
    color: "var(--text-primary)",
    resize: "none" as const,
    maxHeight: "150px",
    overflowY: "auto" as const,
    padding: "4px 0",
  },

  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#5f6368",
  },

  sendBtn: (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    cursor: active ? "pointer" : "default",
    background: active ? "var(--bg-ai)" : "transparent",
    color: active ? "var(--accent-blue)" : "#bdc1c6",
  }),
};
