import React from "react";
import { COLORS } from "../constants";
import { NavSidebar } from "./NavSidebar";

type Props = {
  activePage?: string;
  pageTitle?: string;
  dark?: boolean;
  alertBadge?: number;
  companyName?: string;
  adminName?: string;
  children: React.ReactNode;
};

export const DashboardShell: React.FC<Props> = ({
  activePage = "chat",
  pageTitle = "Chat",
  dark = true,
  alertBadge = 0,
  companyName = "Acme Corp",
  adminName = "admin",
  children,
}) => {
  const bg = dark ? COLORS.bgDark : COLORS.bgLight;
  const headerBg = dark ? COLORS.surface : COLORS.surfaceLight;
  const border = dark ? COLORS.border : COLORS.borderLight;
  const text = dark ? COLORS.text : COLORS.textDark;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: bg,
        display: "flex",
        fontFamily: "sans-serif",
      }}
    >
      <NavSidebar activePage={activePage} dark={dark} alertBadge={alertBadge} companyName={companyName} adminName={adminName} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top header bar */}
        <div
          style={{
            height: 56,
            backgroundColor: headerBg,
            borderBottom: `1px solid ${border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600, fontSize: 16, color: text }}>
            {pageTitle}
          </span>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: COLORS.green,
              }}
            />
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
              {adminName} &middot; {companyName}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
};
