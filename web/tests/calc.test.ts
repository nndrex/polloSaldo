import { describe, expect, it } from "vitest";
import {
  buildRows,
  computeMinutes,
  formatDuration,
  formatHours,
  isStale,
  parseSalary,
  toHourly,
  type PriceEntry,
} from "../src/calc";

function entry(overrides: Partial<PriceEntry>): PriceEntry {
  return {
    restaurant: "primos",
    product: "pollo-entero",
    productName: "1 Pollo",
    price: 42,
    currency: "PEN",
    scrapedAt: "2026-08-29T13:00:00Z",
    sourceUrl: "https://example.com",
    ...overrides,
  };
}

describe("computeMinutes (AC-1, AC-2)", () => {
  it("42 soles at S/15/h = 168 minutes", () => {
    expect(computeMinutes(42, 15)).toBe(168);
  });

  it("3 soles at S/20/h = 9 minutes", () => {
    expect(computeMinutes(3, 20)).toBe(9);
  });
});

describe("formatDuration (AC-1, AC-2, AC-3)", () => {
  it("168 minutes → '2 h 48 min'", () => {
    expect(formatDuration(168)).toBe("2 h 48 min");
  });

  it("9 minutes → '9 min' (not '0 h 9 min')", () => {
    expect(formatDuration(9)).toBe("9 min");
  });

  it("0 minutes → '< 1 min de trabajo'", () => {
    expect(formatDuration(0)).toBe("< 1 min de trabajo");
  });

  it("60 minutes → '1 h'", () => {
    expect(formatDuration(60)).toBe("1 h");
  });
});

describe("parseSalary (AC-4)", () => {
  it("empty → null", () => {
    expect(parseSalary("")).toBeNull();
    expect(parseSalary("   ")).toBeNull();
  });

  it("zero and negative pass through for caller validation", () => {
    expect(parseSalary("0")).toBe(0);
    expect(parseSalary("-5")).toBe(-5);
  });

  it("non-numeric → NaN", () => {
    expect(parseSalary("abc")).toBeNaN();
  });

  it("accepts comma decimal separator", () => {
    expect(parseSalary("15,5")).toBe(15.5);
  });
});

describe("buildRows (AC-5)", () => {
  const prices = [
    entry({ restaurant: "tori", price: 58.9, productName: "POLLO TORI" }),
    entry({ restaurant: "primos", price: 42, productName: "1 Pollo" }),
    entry({ restaurant: "pardos", price: 42, productName: "1 Pardos Brasa" }),
    entry({ restaurant: "villa-chicken", price: 78.2, productName: "1 POLLO" }),
    entry({ restaurant: "primos", product: "cuarto-pollo", price: 35 }),
  ];

  it("sorts by minutes ascending with alphabetical tie-break", () => {
    const rows = buildRows(prices, "pollo-entero", 15);
    expect(rows.map((r) => r.restaurant)).toEqual([
      "pardos",
      "primos",
      "tori",
      "villa-chicken",
    ]);
    expect(rows[0].minutes).toBe(rows[1].minutes);
  });

  it("only includes the selected product", () => {
    const rows = buildRows(prices, "cuarto-pollo", 15);
    expect(rows).toHaveLength(1);
    expect(rows[0].restaurant).toBe("primos");
  });
});

describe("isStale (R5)", () => {
  const now = new Date("2026-08-29T13:00:00Z");

  it("fresh timestamp is not stale", () => {
    expect(isStale("2026-08-29T00:00:00Z", now)).toBe(false);
  });

  it("older than 3 days is stale", () => {
    expect(isStale("2026-08-25T00:00:00Z", now)).toBe(true);
  });

  it("invalid timestamp is treated as stale", () => {
    expect(isStale("not-a-date", now)).toBe(true);
  });
});

describe("formatHours (chart values in hours)", () => {
  it("0 minutes → '< 1 min'", () => {
    expect(formatHours(0)).toBe("< 1 min");
  });

  it("168 minutes → '2.8 h' (es-PE decimal point)", () => {
    expect(formatHours(168)).toBe("2.8 h");
  });

  it("540 minutes → '9 h'", () => {
    expect(formatHours(540)).toBe("9 h");
  });

  it("45 minutes → '0.8 h' (es-PE decimal point)", () => {
    expect(formatHours(45)).toBe("0.8 h");
  });
});

describe("toHourly (spec §7)", () => {
  it("hourly amount passes through", () => {
    expect(toHourly(10, "hour")).toBe(10);
  });

  it("daily 80 → 10 (8-hour workday)", () => {
    expect(toHourly(80, "day")).toBe(10);
  });

  it("monthly 2400 → 10 (240 hours per month)", () => {
    expect(toHourly(2400, "month")).toBe(10);
  });

  it("annual 28800 → 10 (2880 hours per year)", () => {
    expect(toHourly(28800, "year")).toBe(10);
  });

  it("monthly 1500 → 6.25", () => {
    expect(toHourly(1500, "month")).toBe(6.25);
  });
});
