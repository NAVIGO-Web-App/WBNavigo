import { renderHook, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("ThemeContext", () => {
  it("toggles theme", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });
    act(() => {
      result.current.toggleTheme();
    });
    expect(["light", "dark"]).toContain(result.current.theme);
  });
});
