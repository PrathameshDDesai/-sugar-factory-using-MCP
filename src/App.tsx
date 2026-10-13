import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { LayoutProvider } from "./context/LayoutContext";
import { Sidebar } from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import FarmersPage from "./pages/FarmersPage";
import ConsolePage from "./pages/ConsolePage";
import ReportsPage from "./pages/ReportsPage";

export default function App() {
  return (
    <ThemeProvider>
      <LayoutProvider>
        <BrowserRouter>
          <div className="app-shell">
            <Sidebar />
            <main className="main-viewport">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/farmers" element={<FarmersPage />} />
                <Route path="/console" element={<ConsolePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                {/* Fallback redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </LayoutProvider>
    </ThemeProvider>
  );
}
