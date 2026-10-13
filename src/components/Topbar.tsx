import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Menu, Sun, Moon, RefreshCw, Plus, LayoutDashboard } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLayout } from "../context/LayoutContext";

const PAGE_TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "Dashboard", sub: "Farmer supply & payment overview" },
  "/farmers": { title: "Farmers Ledger", sub: "All registered sugarcane suppliers" },
  "/console": { title: "MCP AI Console", sub: "Model Context Protocol intelligence layer" },
  "/reports": { title: "Analytics & Reports", sub: "Village-wise breakdowns and trends" },
};

interface TopbarProps {
  onMenuClick?: () => void;
  onRefresh?: () => void;
  onAddFarmer?: () => void;
  loading?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuClick,
  onRefresh,
  onAddFarmer,
  loading,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toggleMobileSidebar } = useLayout();
  const page = PAGE_TITLES[location.pathname] || { title: "Sanjivani SSF", sub: "" };

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    }
    toggleMobileSidebar();
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn hamburger-btn" onClick={handleMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="page-title">{page.title}</h1>
          <p className="page-sub">{page.sub}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* Redirect to Dashboard Quick Button (when not on dashboard) */}
        {location.pathname !== "/" && (
          <button
            className="btn-ghost redirect-dashboard-btn"
            onClick={() => navigate("/")}
            title="Return to Dashboard"
          >
            <LayoutDashboard size={15} />
            <span className="btn-text">Dashboard</span>
          </button>
        )}

        {onRefresh && (
          <button className="icon-btn" onClick={onRefresh} title="Refresh data">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
        )}

        <button
          className="icon-btn theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {onAddFarmer && (
          <button className="btn-primary" onClick={onAddFarmer}>
            <Plus size={15} />
            <span className="btn-text">Add Farmer</span>
          </button>
        )}
      </div>
    </header>
  );
};
