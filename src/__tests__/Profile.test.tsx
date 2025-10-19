// src/__tests__/Profile.test.tsx
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Profile from "@/pages/Profile";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import * as firebaseAuth from "firebase/auth";
import * as firebaseFirestore from "firebase/firestore";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock Firebase auth
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Firebase firestore
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  updateDoc: vi.fn(),
}));

// Mock react-firebase-hooks/auth
const mockUseAuthState = vi.fn();
vi.mock("react-firebase-hooks/auth", () => ({
  useAuthState: (...args: any[]) => mockUseAuthState(...args),
}));

// Mock Firebase instance
vi.mock("@/firebase", () => ({
  auth: {},
  db: {},
}));

// Mock AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123", email: "test@example.com" },
    login: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock Header component
vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="header">Header</div>,
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="avatar" />,
}));

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value, max }: any) => (
    <div data-testid="progress">
      Progress: {value}/{max}
    </div>
  ),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button onClick={onClick} data-testid={`tab-${value}`}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Edit3: () => <span data-testid="edit-icon">Edit</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  X: () => <span data-testid="close-icon">Close</span>,
}));

// Mock clsx
vi.mock("clsx", () => ({
  default: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Render helper
const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock user data
const mockUserData = {
  name: "Test User",
  email: "test@example.com",
  points: 350,
  profilePictureUrl: "https://example.com/avatar.jpg",
  inventory: [],
  collectibles: [
    {
      id: "collectible-1",
      name: "First Quest",
      description: "Completed your first quest",
      iconUrl: "https://example.com/icon1.png",
      rarity: "common" as const,
    },
    {
      id: "collectible-2",
      name: "Explorer",
      description: "Visited 5 different locations",
      iconUrl: "https://example.com/icon2.png",
      rarity: "rare" as const,
    },
  ],
  streakDays: 3,
};

describe("Profile", () => {
  const mockGetDocs = vi.mocked(firebaseFirestore.getDocs);
  const mockGetDoc = vi.mocked(firebaseFirestore.getDoc);
  const mockUpdateDoc = vi.mocked(firebaseFirestore.updateDoc);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthState.mockReturnValue([
      { uid: "test-user-123", email: "test@example.com" },
      false,
      undefined,
    ]);

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "user-doc-123",
          data: () => mockUserData,
        },
      ],
    } as any);

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        collectibles: mockUserData.collectibles,
      }),
    } as any);

    mockUpdateDoc.mockResolvedValue(undefined);
  });

  it("renders profile header with user information", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());
    expect(screen.getByText("Level 4")).toBeInTheDocument();
    expect(screen.getByText(/Rank #/)).toBeInTheDocument();
    expect(screen.getByText("350")).toBeInTheDocument();
  });

  it("displays collectibles in achievements tab (scoped)", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    const achievementsSection = screen.getByTestId("tab-content-achievements");

    expect(
      within(achievementsSection).getByText("First Quest")
    ).toBeInTheDocument();
    expect(
      within(achievementsSection).getByText("Completed your first quest")
    ).toBeInTheDocument();
    expect(within(achievementsSection).getByText("Explorer")).toBeInTheDocument();
    expect(
      within(achievementsSection).getByText("Visited 5 different locations")
    ).toBeInTheDocument();
  });

  it("displays collectibles in inventory tab (scoped)", async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => expect(screen.getByText("Test User")).toBeInTheDocument());

    const inventorySection = screen.getByTestId("tab-content-inventory");

    expect(
      within(inventorySection).getByText("First Quest")
    ).toBeInTheDocument();
    expect(within(inventorySection).getByText("Explorer")).toBeInTheDocument();
  });
});
