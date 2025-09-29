// src/_tests_/geo.test.ts
import { haversineDistanceMeters } from "@/lib/geo";
import { describe, it, expect } from "vitest";

describe("haversineDistanceMeters", () => {
  it("calculates distance between two identical points as 0", () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 0 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(0, 5);
  });

  it("calculates approximate distance between two known points", () => {
    // London (51.5074, -0.1278) to Paris (48.8566, 2.3522) ≈ 343 km (343000 m)
    const london = { lat: 51.5074, lng: -0.1278 };
    const paris = { lat: 48.8566, lng: 2.3522 };
    const meters = haversineDistanceMeters(london, paris);
    expect(meters / 1000).toBeGreaterThan(340);
    expect(meters / 1000).toBeLessThan(350);
  });
});
