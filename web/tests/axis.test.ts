import { describe, expect, it } from "vitest";
import { computeAxis, niceTicks } from "../src/axis";

describe("niceTicks", () => {
  it("returns [0] for maxMinutes <= 0 or non-finite", () => {
    expect(niceTicks(0)).toEqual([0]);
    expect(niceTicks(-5)).toEqual([0]);
    expect(niceTicks(Number.NaN)).toEqual([0]);
  });

  it("starts at 0 and ends at or above maxMinutes", () => {
    for (const max of [1, 9, 42, 107.6, 168, 356, 540, 1000]) {
      const ticks = niceTicks(max);
      expect(ticks[0]).toBe(0);
      expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(max);
    }
  });

  it("is strictly increasing", () => {
    const ticks = niceTicks(356);
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
    }
  });

  it("uses nice steps from the 1/2/5 * 10^k family", () => {
    for (const max of [1, 9, 42, 107.6, 168, 356, 540, 1000, 0.5]) {
      const ticks = niceTicks(max);
      for (let i = 1; i < ticks.length; i++) {
        const step = ticks[i] - ticks[i - 1];
        const magnitude = Math.pow(10, Math.floor(Math.log10(step)));
        const normalized = step / magnitude;
        const isNice = [1, 2, 5, 10].some((n) => Math.abs(n - normalized) < 1e-6);
        expect(isNice).toBe(true);
      }
    }
  });

  it("produces 4-5 gridline values for typical ranges", () => {
    expect(niceTicks(168)).toHaveLength(5);
    expect(niceTicks(356)).toHaveLength(5);
    expect(niceTicks(540)).toHaveLength(4);
    expect(niceTicks(107.6)).toHaveLength(4);
  });

  it("returns known values for representative maxima", () => {
    expect(niceTicks(168)).toEqual([0, 50, 100, 150, 200]);
    expect(niceTicks(356)).toEqual([0, 100, 200, 300, 400]);
  });
});

describe("computeAxis", () => {
  it("returns ticks plus the top tick as maxTick", () => {
    const axis = computeAxis(168);
    expect(axis.ticks).toEqual([0, 50, 100, 150, 200]);
    expect(axis.maxTick).toBe(200);
  });

  it("handles maxMinutes <= 0", () => {
    const axis = computeAxis(0);
    expect(axis.ticks).toEqual([0]);
    expect(axis.maxTick).toBe(0);
  });
});