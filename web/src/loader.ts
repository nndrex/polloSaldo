import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { PricesDataset } from "./calc";
import schema from "../../specs/contracts/prices.schema.json";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export async function loadPrices(
  fetchFn: typeof fetch = fetch,
): Promise<PricesDataset> {
  const response = await fetchFn("/prices.json");
  if (!response.ok) {
    throw new Error(`prices.json unavailable (HTTP ${response.status})`);
  }
  const data = await response.json();
  if (!validate(data)) {
    throw new Error("prices.json does not match the schema contract");
  }
  return data as unknown as PricesDataset;
}
