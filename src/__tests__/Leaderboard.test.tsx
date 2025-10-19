import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Leaderboard from "@/pages/Leaderboard";
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
  getDocs: vi.fn(),
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
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="avatar" />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Trophy: () => <span data-testid="trophy-icon">Trophy</span>,
  Medal: () => <span data-testid="medal-icon">Medal</span>,
  TrendingUp: () => <span data-testid="trending-icon">Trend</span>,
  Crown: () => <span data-testid="crown-icon">Crown</span>,
}));

// Mock Theme Context
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light" }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

// Mock leaderboard data
const mockLeaderboardData = [
  {
    name: "Top Player",
    email: "top@example.com",
    points: 1000,
    avatar: "https://example.com/avatar1.jpg",
    rank: 1,
  },
  {
    name: "Second Place",
    email: "second@example.com",
    points: 800,
    avatar: "https://example.com/avatar2.jpg",
    rank: 2,
  },
  {
    name: "Third Place",
    email: "third@example.com",
    points: 600,
    avatar: "https://example.com/avatar3.jpg",
    rank: 3,
  },
  {
    name: "Test User",
    email: "test@example.com",
    points: 400,
    avatar: "https://example.com/avatar4.jpg",
    rank: 4,
    isCurrentUser: true,
  },
  {
    name: "Last Place",
    email: "last@example.com",
    points: 200,
    avatar: "https://example.com/avatar5.jpg",
    rank: 5,
  },
];

describe("Leaderboard", () => {
  const mockGetDocs = vi.mocked(firebaseFirestore.getDocs);

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthState.mockReturnValue([
      { uid: "test-user-123", email: "test@example.com" },
      false,
      undefined,
    ]);

    mockGetDocs.mockResolvedValue({
      docs: mockLeaderboardData.map(entry => ({
        data: () => ({
          name: entry.name,
          email: entry.email,
          points: entry.points,
          profilePictureUrl: entry.avatar,
        }),
      })),
    } as any);
  });

  it("renders leaderboard header", async () => {
    renderWithProviders(<Leaderboard />);
    expect(screen.getByText("NAVIGO Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("See how you rank against other campus explorers")).toBeInTheDocument();
  });

  it("displays top 3 players in podium section", async () => {
    renderWithProviders(<Leaderboard />);
    await waitFor(() => {
      expect(screen.getByText("Top Player")).toBeInTheDocument();
    });
    expect(screen.getByText("Second Place")).toBeInTheDocument();
    expect(screen.getByText("Third Place")).toBeInTheDocument();
  });

  it("shows special icons for top 3 positions", async () => {
    renderWithProviders(<Leaderboard />);
    await waitFor(() => {
      expect(screen.getByTestId("crown-icon")).toBeInTheDocument();
    });
    const medalIcons = screen.getAllByTestId("medal-icon");
    expect(medalIcons).toHaveLength(2);
  });

  it("displays current user with 'You' badge", async () => {
    renderWithProviders(<Leaderboard />);
    await waitFor(() => {
      const youBadges = screen.getAllByText("You");
      expect(youBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays points for each player", async () => {
    renderWithProviders(<Leaderboard />);

    // Wait for top entries to load
    await waitFor(() => {
      // Match numbers with commas or spaces
      const firstPlace = screen.getByText(/1[, ]?000/);
      expect(firstPlace).toHaveClass("text-2xl", "font-bold");

      const secondPlace = screen.getByText(/800/);
      expect(secondPlace).toHaveClass("text-2xl", "font-bold");

      const thirdPlace = screen.getByText(/600/);
      expect(thirdPlace).toHaveClass("text-2xl", "font-bold");

      // Check “400 points” — allow for spaces
      const fourthPlace = screen.getByText(/400\s*points/);
      expect(fourthPlace).toHaveClass("text-sm", "text-muted-foreground");
    });
  });



  it("displays user avatars", async () => {
    renderWithProviders(<Leaderboard />);
    await waitFor(() => {
      const avatars = screen.getAllByAltText("avatar");
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  it("displays full rankings section", async () => {
    renderWithProviders(<Leaderboard />);
    await waitFor(() => {
      expect(screen.getByText("Full Rankings")).toBeInTheDocument();
    });
    expect(screen.getByTestId("trophy-icon")).toBeInTheDocument();
  });

  it("handles error when fetching leaderboard data", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetDocs.mockRejectedValueOnce(new Error("Failed to fetch"));
    
    renderWithProviders(<Leaderboard />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching leaderboard:",
        expect.any(Error)
      );
    });
    
    consoleSpy.mockRestore();
  });
});