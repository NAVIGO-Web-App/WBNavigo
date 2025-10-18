// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QuestProvider } from "@/contexts/QuestContext";
import Index from "./pages/Index";
import SignUpPage from "./pages/SignUp";
import CampusMap from "./pages/CampusMap";
import Quests from "./pages/Quests";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import QuestDetail from "./pages/QuestDetail";
import QuizDetail from "./pages/QuizDetail"; // 🚨 ADD THIS IMPORT
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { useAbandonmentNotification } from '@/hooks/useAbandonmentNotification';

const queryClient = new QueryClient();

// Simple wrapper for dark mode styling
function DarkModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      {children}
    </div>
  );
}

// Component that uses the hook properly
function AppContent() {
  useAbandonmentNotification();
  
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <DarkModeWrapper>
              <Index />
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <DarkModeWrapper>
              <SignUpPage />
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/map" 
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <CampusMap />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/quests" 
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <Quests />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        {/* 🚨 UPDATED: Fixed route path for QuestDetail */}
        <Route 
          path="/quest/:questId"
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <QuestDetail />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        {/* 🚨 NEW: Add QuizDetail route */}
        <Route 
          path="/quests/:questId" 
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <QuizDetail />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/leaderboard" 
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <DarkModeWrapper>
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <DarkModeWrapper>
              <AdminProtectedRoute>
                <Admin />
              </AdminProtectedRoute>
            </DarkModeWrapper>
          } 
        />
        <Route 
          path="*" 
          element={
            <DarkModeWrapper>
              <NotFound />
            </DarkModeWrapper>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QuestProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ToastContainer
              position="top-center"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </QuestProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;