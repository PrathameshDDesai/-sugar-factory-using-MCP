import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bot,
  FileBarChart2,
  X,
} from "lucide-react";
import { useLayout } from "../context/LayoutContext";

const NAV = [
  { to: "/", icon: <LayoutDashboard size={19} />, label: "Dashboard" },
  { to: "/farmers", icon: <Users size={19} />, label: "Farmers Ledger" },
  { to: "/console", icon: <Bot size={19} />, label: "MCP AI Console" },
  { to: "/reports", icon: <FileBarChart2 size={19} />, label: "Analytics & Reports" },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useLayout();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileSidebarOpen ? "sidebar--open" : ""}`}>
        {/* Brand / Logo */}
        <div className="sidebar-logo" onClick={() => { navigate("/"); setMobileSidebarOpen(false); }} title="Go to Dashboard">
          <span className="logo-leaf">🌾</span>
          <div className="logo-text-block">
            <span className="logo-abbr">SSF</span>
            <span className="logo-full">Sanjivani</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMobileSidebarOpen(false);
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item--active" : ""}`
              }
              onClick={() => setMobileSidebarOpen(false)}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer info */}
        <div className="sidebar-footer">
          <div className="server-status">
            <span className="server-dot" />
            <span className="server-text">MCP Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
