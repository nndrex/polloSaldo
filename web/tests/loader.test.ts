import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPrices } from "../src/loader";
import validDataset from "./fixtures/valid-dataset.json";

function jsonResponse(body: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(JSON.parse(body)),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadPrices (AC-6, AC-8)", () => {
  it("returns the dataset for a valid prices.json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(JSON.stringify(validDataset))),
    );

    const data = await loadPrices();
    expect(data.updatedAt).toBe(validDataset.updatedAt);
    expect(data.prices).toHaveLength(1);
  });

  it("rejects on HTTP failure (missing file)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse("not found", 404)),
    );

    await expect(loadPrices()).rejects.toThrow(/404/);
  });

  it("rejects on corrupted JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse("{broken")),
    );

    await expect(loadPrices()).rejects.toThrow();
  });

  it("rejects when JSON violates the schema contract (price as string)", async () => {
    const invalid = JSON.parse(JSON.stringify(validDataset));
    invalid.prices[0].price = "42.00";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(JSON.stringify(invalid))),
    );

    await expect(loadPrices()).rejects.toThrow(/schema contract/);
  });
});
