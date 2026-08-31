export interface Axis {
  ticks: number[];
  maxTick: number;
}

export function niceTicks(maxMinutes: number): number[] {
  if (!Number.isFinite(maxMinutes) || maxMinutes <= 0) return [0];
  const rawStep = maxMinutes / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  const step = nice * magnitude;
  const ticks: number[] = [];
  for (let v = 0; v < maxMinutes; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  ticks.push(Math.round((ticks[ticks.length - 1] + step) * 1e6) / 1e6);
  return ticks;
}

export function computeAxis(maxMinutes: number): Axis {
  const ticks = niceTicks(maxMinutes);
  return { ticks, maxTick: ticks[ticks.length - 1] };
}