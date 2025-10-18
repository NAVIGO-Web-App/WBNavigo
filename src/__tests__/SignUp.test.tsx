// src/__tests__/SignUp.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignUp from "@/pages/SignUp";
import { toast } from "react-toastify";
import { ThemeProvider } from "@/contexts/ThemeContext";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";
import { AuthProvider } from "@/contexts/AuthContext";

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ------------------- Mock react-toastify -------------------
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// ------------------- Mock AuthContext -------------------
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    signup: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock the entire firebase module
vi.mock("@/firebase", () => ({
  auth: {
    signOut: vi.fn(() => Promise.resolve()),
  },
  db: {},
}));

vi.mock("firebase/auth");
vi.mock("firebase/firestore");

// ------------------- Consistent Render with All Providers -------------------
const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe("SignUp", () => {
  const mockCreateUser = vi.spyOn(firebaseAuth, "createUserWithEmailAndPassword");
  const mockSetDoc = vi.spyOn(firebaseFirestore, "setDoc");

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: simulate email already in use
    mockCreateUser.mockImplementation(() =>
      Promise.reject({ code: "auth/email-already-in-use", message: "Email already in use" })
    );
    mockSetDoc.mockResolvedValue(undefined);
  });

  it("renders registration form fields", () => {
    renderWithProviders(<SignUp />);
    
    expect(screen.getByPlaceholderText(/Your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  it("handles successful registration", async () => {
    // Mock successful Firebase auth creation
    mockCreateUser.mockImplementationOnce(() =>
      Promise.resolve({ 
        user: { 
          uid: "123", 
          email: "siyabongamtolo0@gmail.com",
          displayName: null
        } 
      } as any)
    );

    renderWithProviders(<SignUp />);

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/Your name/i), { 
      target: { value: "Junior Mtolo" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: "siyabongamtolo0@gmail.com" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Create password/i), { 
      target: { value: "password123" } 
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    // Wait for the success message and form switch
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Account created successfully. Please sign in.",
        expect.any(Object)
      );
    });

    // Check that the form switched to login mode (this is the key observable behavior)
    await waitFor(() => {
      expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    });
  });

  it("handles Firebase registration errors gracefully", async () => {
    renderWithProviders(<SignUp />);

    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText(/Your name/i), { 
      target: { value: "Test User" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: "test@example.com" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/Create password/i), { 
      target: { value: "password123" } 
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    // Wait for error handling - use expect.anything() for the auth parameter
    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.anything(), // This will match any auth object
        "test@example.com",
        "password123"
      );
    });

    // Check error toast - match the actual error message from your component
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/An error occurred while signing up/i),
        expect.any(Object)
      );
    });
  });
});