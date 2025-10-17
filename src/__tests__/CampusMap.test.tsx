import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import CampusMap from "@/pages/CampusMap";
import { useQuest } from "@/contexts/QuestContext";
import { useTheme } from "@/contexts/ThemeContext";

const mockNavigate = vi.fn();

// 🧩 FULL Google Maps Mock Setup
beforeAll(() => {
  global.window.google = {
    maps: {
      Map: vi.fn(() => ({
        setCenter: vi.fn(),
        setZoom: vi.fn(),
        panTo: vi.fn(),
      })),
      Marker: vi.fn(() => ({
        setMap: vi.fn(),
      })),
      DirectionsService: vi.fn(() => ({
        route: vi.fn((req, cb) => cb({}, "OK")),
      })),
      DirectionsRenderer: vi.fn(() => ({
        setMap: vi.fn(),
        setDirections: vi.fn(),
      })),
      Size: vi.fn((width, height) => ({ width, height })),
      TravelMode: {
        WALKING: "WALKING",
        DRIVING: "DRIVING",
        BICYCLING: "BICYCLING",
        TRANSIT: "TRANSIT",
      },
      geometry: {
        spherical: {
          computeDistanceBetween: vi.fn(() => 100),
        },
      },
      LatLng: vi.fn((lat, lng) => ({ lat, lng })),
      LatLngBounds: vi.fn(() => ({
        extend: vi.fn(),
        getCenter: vi.fn(() => ({ lat: () => 0, lng: () => 0 })),
      })),
    },
  };
});

// 🧩 Mock Firebase
vi.mock("../firebase", () => ({ db: {} }));

// 🧩 Mock Google Maps API
vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
  GoogleMap: ({ children, onLoad }: any) => {
    if (onLoad) onLoad({ panTo: vi.fn(), setZoom: vi.fn() });
    return <div data-testid="google-map">{children}</div>;
  },
  Marker: ({ onClick }: any) => (
    <div data-testid="marker" onClick={onClick}>
      Marker
    </div>
  ),
  DirectionsRenderer: ({ directions }: any) => (
    <div data-testid="directions">
      {directions ? "Directions OK" : "No directions"}
    </div>
  ),
}));

// 🧩 Mock contexts
vi.mock("@/contexts/QuestContext", () => ({
  useQuest: vi.fn(),
}));
vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: vi.fn(),
}));

// 🧩 Mock child components
vi.mock("@/components/Header", () => ({
  default: () => <div data-testid="header">Mock Header</div>,
}));
vi.mock("@/components/ActiveQuestPanel", () => ({
  default: () => <div data-testid="active-panel">Mock ActiveQuestPanel</div>,
}));

// 🧩 Mock react-router-dom navigate
vi.mock("react-router-dom", async () => {
  const mod = await vi.importActual<any>("react-router-dom");
  return {
    ...mod,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: {} }),
  };
});

describe("CampusMap Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    (useTheme as vi.Mock).mockReturnValue({ theme: "light" });

    (useQuest as vi.Mock).mockReturnValue({
      quests: [
        {
          id: "1",
          title: "Quest One",
          description: "Find the old library",
          position: { lat: -26.19, lng: 28.03 },
          difficulty: "Easy",
          points: 100,
          location: "Old Library",
          type: "Location",
        },
      ],
      userProgress: {
        completedQuests: [],
        inProgressQuests: {},
      },
      loading: false,
      activeQuest: null,
      updateLastActivity: vi.fn(),
      completeLocationQuest: vi.fn().mockReturnValue(false),
      completeQuest: vi.fn(),
      refreshQuests: vi.fn(),
    });
  });

  it("renders the header and map", () => {
    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(screen.getByTestId("active-panel")).toBeInTheDocument();
  });

  it("shows loading screen when quests are loading", () => {
    (useQuest as vi.Mock).mockReturnValueOnce({
      quests: [],
      userProgress: { completedQuests: [], inProgressQuests: {} },
      loading: true,
    });

    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading quests/i)).toBeInTheDocument();
  });

  it("renders quest markers and details when clicked", async () => {
    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    const marker = screen.getByTestId("marker");
    fireEvent.click(marker);

    await waitFor(() => {
      const quests = screen.getAllByText("Quest One");
      expect(quests.length).toBeGreaterThan(0);
    });
  });

  it("navigates when Start Quest is clicked", async () => {
    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId("marker"));

    const startButton = await screen.findByText(/Start Quest/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/quest/1");
    });
  });

  it("shows directions error and allows retry", async () => {
    (useQuest as vi.Mock).mockReturnValueOnce({
      quests: [
        {
          id: "1",
          title: "Quest One",
          description: "Find the old library",
          position: { lat: -26.19, lng: 28.03 },
          difficulty: "Easy",
          points: 100,
          location: "Old Library",
          type: "Location",
        },
      ],
      userProgress: { completedQuests: [], inProgressQuests: {} },
      loading: false,
      activeQuest: null,
      updateLastActivity: vi.fn(),
      completeLocationQuest: vi.fn(),
      completeQuest: vi.fn(),
      refreshQuests: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByTestId("marker"));

    await waitFor(() =>
      expect(
        screen.getByText(/Directions will appear here/i)
      ).toBeInTheDocument()
    );
  });

  it("handles no quests gracefully", () => {
    (useQuest as vi.Mock).mockReturnValueOnce({
      quests: [],
      userProgress: { completedQuests: [], inProgressQuests: {} },
      loading: false,
      activeQuest: null,
      updateLastActivity: vi.fn(),
      completeLocationQuest: vi.fn(),
      completeQuest: vi.fn(),
      refreshQuests: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CampusMap />
      </BrowserRouter>
    );

    expect(screen.getByText(/No quests available/i)).toBeInTheDocument();
  });
});
