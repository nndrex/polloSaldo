export interface PriceEntry {
  restaurant: string;
  product: string;
  productName: string;
  price: number;
  currency: string;
  scrapedAt: string;
  sourceUrl: string;
}

export interface PricesDataset {
  version: number;
  updatedAt: string;
  prices: PriceEntry[];
}

export interface Row {
  restaurant: string;
  productName: string;
  price: number;
  minutes: number;
  scrapedAt: string;
}

export const STALE_AFTER_DAYS = 3;

export type Period = "hour" | "day" | "month" | "year";

export const HOURS_PER_DAY = 8;
export const HOURS_PER_MONTH = 240;
export const HOURS_PER_YEAR = 2880;

export function toHourly(amount: number, period: Period): number {
  switch (period) {
    case "hour":
      return amount;
    case "day":
      return amount / HOURS_PER_DAY;
    case "month":
      return amount / HOURS_PER_MONTH;
    case "year":
      return amount / HOURS_PER_YEAR;
  }
}

export function computeMinutes(price: number, hourlySalary: number): number {
  return Math.round((price / hourlySalary) * 60);
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "< 1 min de trabajo";
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

const HOURS_FORMAT = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

export function formatHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return "< 1 min";
  return `${HOURS_FORMAT.format(totalMinutes / 60)} h`;
}

const COLLATOR = new Intl.Collator("es-PE");

export function buildRows(
  prices: PriceEntry[],
  product: string,
  hourlySalary: number,
): Row[] {
  return prices
    .filter((p) => p.product === product)
    .map((p) => ({
      restaurant: p.restaurant,
      productName: p.productName,
      price: p.price,
      minutes: computeMinutes(p.price, hourlySalary),
      scrapedAt: p.scrapedAt,
    }))
    .sort(
      (a, b) =>
        a.minutes - b.minutes ||
        COLLATOR.compare(a.restaurant, b.restaurant),
    );
}

export function parseSalary(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : NaN;
}

export function isStale(scrapedAt: string, now: Date = new Date()): boolean {
  const scraped = new Date(scrapedAt);
  if (Number.isNaN(scraped.getTime())) return true;
  const ageMs = now.getTime() - scraped.getTime();
  return ageMs > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
