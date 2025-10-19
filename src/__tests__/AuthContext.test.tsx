// src/__tests__/AuthContext.test.tsx
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Mock Firebase modules
vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn(),
}));
vi.mock("firebase/firestore", async () => {
    return {
      getFirestore: vi.fn(),
      doc: vi.fn(),
      getDoc: vi.fn(() =>
        Promise.resolve({
          exists: () => true, // ✅ simulate user exists
          data: () => ({
            email: "siyabongamtolo0@gmail.com",
            name: "Junior Mtolo",
            isAdmin: false,
            points: 0,
            inventory: [],
          }),
        })
      ),
      setDoc: vi.fn(() => Promise.resolve()),
      updateDoc: vi.fn(() => Promise.resolve()),
      collection: vi.fn(),
      query: vi.fn(),
      where: vi.fn(),
      getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
    };
  });
  
vi.mock("@/firebase", () => ({
  auth: { signOut: vi.fn() },
  db: {},
}));

import { onAuthStateChanged } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { auth } from "@/firebase";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => (store[key] = value)),
    removeItem: vi.fn((key) => delete store[key]),
    clear: vi.fn(() => (store = {})),
  };
})();
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Helper component to consume the AuthContext
const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();

  React.useEffect(() => {
    // simulate a login after mount if not loading
    if (!isLoading && !user) {
      login({
        uid: "123",
        displayName: "Junior Mtolo",
        email: "siyabongamtolo0@gmail.com",
      });
    }
  }, [isLoading]);

  return (
    <div data-testid="auth-state">
      {isLoading ? "Loading..." : user ? user.displayName : "No user"}
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  it("provides default values before authentication", async () => {
    (onAuthStateChanged as any).mockImplementation((_auth, callback) => {
      callback(null); // simulate signed out
      return () => {};
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("auth-state").textContent).toContain("No user");
    });
    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
  });

  it("loads user from Firebase Auth and Firestore", async () => {
    const mockUser = {
      uid: "123",
      displayName: "Junior Mtolo",
      email: "siyabongamtolo0@gmail.com",
    };
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: true, name: "Admin Junior" }),
    });
    (onAuthStateChanged as any).mockImplementation((_auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("auth-state").textContent).toContain("Admin Junior");
    });

    const savedUser = JSON.parse(localStorage.setItem.mock.calls[0][1]);
    expect(savedUser.isAdmin).toBe(true);
    expect(savedUser.displayName).toBe("Admin Junior");
  });

  it("handles login() manually and saves to localStorage", async () => {
    (getDoc as any).mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: false }),
    });

    (onAuthStateChanged as any).mockImplementation((_auth, callback) => {
      callback(null);
      return () => {};
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("auth-state").textContent).toContain("Junior Mtolo");
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      expect.stringContaining("Junior Mtolo")
    );
  });

  it("handles logout() and clears localStorage", async () => {
    (onAuthStateChanged as any).mockImplementation((_auth, callback) => {
      callback({ uid: "1", displayName: "User", email: "u@test.com" });
      return () => {};
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    getByText("Logout").click();

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  it("handles Firestore fetch error gracefully", async () => {
    (onAuthStateChanged as any).mockImplementation((_auth, callback) => {
      callback({ uid: "999", displayName: "ErrorUser", email: "err@test.com" });
      return () => {};
    });
    (getDoc as any).mockRejectedValueOnce(new Error("Firestore failure"));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("auth-state").textContent).toContain("No user");
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith("user");
  });
});
