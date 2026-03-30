import React from "react";
import { COLORS } from "../constants";

const NAV_ITEMS = [
  { id: "chat", label: "Chat" },
  { id: "documents", label: "Documents" },
  { id: "rules", label: "Rules" },
  { id: "alerts", label: "Alerts" },
  { id: "approvals", label: "Approvals" },
  { id: "analytics", label: "Analytics" },
  { id: "audit", label: "Audit Log" },
];

type Props = {
  activePage?: string;
  dark?: boolean;
  alertBadge?: number;
  companyName?: string;
  adminName?: string;
};

export const NavSidebar: React.FC<Props> = ({
  activePage = "chat",
  dark = true,
  alertBadge = 0,
  companyName = "Acme Corp",
  adminName = "admin",
}) => {
  const bg = dark ? COLORS.surface : "#fafafa";
  const text = dark ? COLORS.text : COLORS.textDark;
  const border = dark ? COLORS.border : COLORS.borderLight;

  return (
    <div
      style={{
        width: 240,
        height: "100%",
        backgroundColor: bg,
        borderRight: `1px solid ${border}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "22px 24px",
          borderBottom: `1px solid ${border}`,
          fontFamily: "monospace",
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.blue,
          letterSpacing: "-0.5px",
        }}
      >
        GuardRAG
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, paddingTop: 8 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activePage;
          return (
            <div
              key={item.id}
              style={{
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isActive ? COLORS.blue : "transparent",
                color: isActive ? "#fff" : text,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                borderLeft: `3px solid ${isActive ? COLORS.blue : "transparent"}`,
                cursor: "default",
              }}
            >
              <span>{item.label}</span>
              {item.id === "alerts" && alertBadge > 0 && (
                <span
                  style={{
                    backgroundColor: COLORS.red,
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 2,
                    padding: "1px 6px",
                  }}
                >
                  {alertBadge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* User */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: `1px solid ${border}`,
        }}
      >
        <div
          style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 3 }}
        >
          {adminName}
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          {companyName} &middot; Admin
        </div>
      </div>
    </div>
  );
};
