import "./style.css";
import {
  buildRows,
  formatHours,
  isStale,
  parseSalary,
  toHourly,
  type Period,
  type PricesDataset,
  type Row,
} from "./calc";
import { loadPrices } from "./loader";
import { computeAxis, type Axis } from "./axis";
import { PERIOD_OPTIONS, PRODUCT_NAMES, RESTAURANT_NAMES, STRINGS } from "./strings";

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const hero = byId<HTMLElement>("hero");
const salaryInput = byId<HTMLInputElement>("salary");
const salaryHint = byId<HTMLParagraphElement>("salary-hint");
const productOptions = byId<HTMLDivElement>("product-options");
const form = byId<HTMLFormElement>("order-form");
const bars = byId<HTMLElement>("bars");
const rowsEl = byId<HTMLDivElement>("rows");
const gridEl = byId<HTMLDivElement>("grid");
const axisEl = byId<HTMLDivElement>("axis");
const chartUpdated = byId<HTMLSpanElement>("chart-updated");
const toplink = byId<HTMLButtonElement>("toplink");

const DEFAULT_PERIOD: Period = "month";
const DEFAULT_PRODUCT = "cuarto-pollo";
let selectedPeriod: Period = DEFAULT_PERIOD;

const orderRow = document.querySelector<HTMLDivElement>(".order__row");
const periodSelect = document.createElement("select");
periodSelect.className = "order__select";
periodSelect.id = "period";
periodSelect.setAttribute("aria-label", STRINGS.periodAria);
for (const option of PERIOD_OPTIONS) {
  const el = document.createElement("option");
  el.value = option.value;
  el.textContent = option.label;
  periodSelect.append(el);
}
periodSelect.value = DEFAULT_PERIOD;
orderRow?.insertAdjacentElement("afterend", periodSelect);

byId("eyebrow").textContent = STRINGS.eyebrow;
byId("headline").textContent = STRINGS.headline;
byId("lede").textContent = STRINGS.lede;
byId("salary-label").textContent = STRINGS.salaryLabel;
salaryHint.textContent = STRINGS.salaryHint;
salaryInput.placeholder = STRINGS.salaryPlaceholder;
byId("cta").textContent = STRINGS.cta;
byId("product-legend").textContent = STRINGS.productLabel;
byId("order-note").textContent = STRINGS.orderNote;
byId("chart-kicker").textContent = STRINGS.chartKicker;
byId("chart-title").textContent = STRINGS.chartTitle;
byId("chart-sub").textContent = STRINGS.chartSub;
byId("chart-cat").textContent = STRINGS.chartCat;
toplink.textContent = STRINGS.backToTop;
const githubLink = byId<HTMLAnchorElement>("github-link");
githubLink.textContent = STRINGS.githubLabel;
githubLink.href = STRINGS.githubUrl;
hero.setAttribute("aria-label", STRINGS.heroAria);
bars.setAttribute("aria-label", STRINGS.barsAria);
document.title = STRINGS.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute("content", STRINGS.description);

for (const [id, name] of Object.entries(PRODUCT_NAMES)) {
  const label = document.createElement("label");
  label.className = "order__seg-opt";
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "product";
  radio.value = id;
  if (id === DEFAULT_PRODUCT) radio.checked = true;
  const span = document.createElement("span");
  span.textContent = name;
  label.append(radio, span);
  productOptions.append(label);
}

let dataset: PricesDataset | null = null;
let loadError: string | null = null;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const parallaxEls = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));
const fadeEl = document.querySelector<HTMLElement>("[data-fade]");
let ticking = false;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyParallax(): void {
  ticking = false;
  if (reduceMotion) return;
  const scrollY = window.scrollY;
  const heroH = hero ? hero.offsetHeight : window.innerHeight;
  const heroVisible = scrollY < heroH + 80;
  for (const el of parallaxEls) {
    const speed = parseFloat(el.dataset.parallax ?? "") || 0;
    if (heroVisible) {
      el.style.transform = `translate3d(0, ${(scrollY * speed).toFixed(1)}px, 0)`;
    }
  }
  if (fadeEl && heroVisible) {
    const progress = clamp(scrollY / (heroH * 0.7), 0, 1);
    fadeEl.style.opacity = (1 - progress * 0.85).toFixed(3);
  }
}

function requestTick(): void {
  if (!ticking) {
    ticking = true;
    window.requestAnimationFrame(applyParallax);
  }
}

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", requestTick);
applyParallax();

const observed = new Set<Element>();
let revealObserver: IntersectionObserver | null = null;
if ("IntersectionObserver" in window && !reduceMotion) {
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver?.unobserve(entry.target);
          observed.delete(entry.target);
        }
      }
    },
    { threshold: 0.35 },
  );
}

function selectedProduct(): string {
  const checked = productOptions.querySelector<HTMLInputElement>("input:checked");
  return checked ? checked.value : DEFAULT_PRODUCT;
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
}

const TICK_FORMAT = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

function formatTick(hours: number): string {
  return TICK_FORMAT.format(hours);
}

const HOURLY_FORMAT = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function renderAxisLegend(hourlySalary: number | null): void {
  byId("chart-foot-strong").textContent =
    hourlySalary !== null
      ? STRINGS.axisLegendSalary.replace("{hourly}", HOURLY_FORMAT.format(hourlySalary))
      : STRINGS.axisLabel;
}

function clearChart(): void {
  rowsEl.replaceChildren();
  gridEl.replaceChildren();
  axisEl.replaceChildren();
}

function showState(message: string): void {
  rowsEl.replaceChildren();
  const state = document.createElement("p");
  state.className = "chart__state";
  state.textContent = message;
  rowsEl.append(state);
}

function renderAxis(axis: Axis): void {
  gridEl.replaceChildren();
  axisEl.replaceChildren();
  for (const tick of axis.ticks) {
    const pct = axis.maxTick > 0 ? (tick / axis.maxTick) * 100 : 0;
    const line = document.createElement("span");
    line.style.left = `${pct}%`;
    gridEl.append(line);
    const label = document.createElement("span");
    label.style.left = `${pct}%`;
    label.textContent = formatTick(tick);
    axisEl.append(label);
  }
}

function renderRows(rows: Row[], maxTick: number): void {
  rowsEl.replaceChildren();
  rows.forEach((row, i) => {
    const div = document.createElement("div");
    div.className = "chart__row chart__reveal";
    const width = maxTick > 0 ? Math.min(100, (row.minutes / maxTick) * 100) : 0;
    div.style.setProperty("--w", `${width}%`);
    div.style.setProperty("--i", String(i));

    const bar = document.createElement("span");
    bar.className = "chart__fillbar";
    div.append(bar);

    const meta = document.createElement("span");
    meta.className = "chart__meta";
    const value = document.createElement("span");
    value.className = "chart__value";
    value.textContent = formatHours(row.minutes);
    const name = document.createElement("span");
    name.className = "chart__name";
    name.textContent = RESTAURANT_NAMES[row.restaurant] ?? row.restaurant;
    meta.append(value, name);
    div.append(meta);

    const detail = document.createElement("span");
    detail.className = "chart__detail";
    detail.textContent = `${row.productName} · S/ ${row.price.toFixed(2)}`;
    if (isStale(row.scrapedAt)) {
      const stale = document.createElement("em");
      stale.className = "stale";
      stale.textContent = STRINGS.staleFlag;
      detail.append(" ", stale);
    }
    div.append(detail);
    rowsEl.append(div);
  });
}

function observeRows(): void {
  for (const el of observed) revealObserver?.unobserve(el);
  observed.clear();
  for (const row of rowsEl.querySelectorAll<HTMLElement>(".chart__reveal")) {
    if (revealObserver) {
      observed.add(row);
      revealObserver.observe(row);
    } else {
      row.classList.add("is-visible");
    }
  }
}

function render(): void {
  const salary = parseSalary(salaryInput.value);
  const salaryValid = salary !== null && Number.isFinite(salary) && salary > 0;

  if (salary === null) {
    salaryHint.textContent = STRINGS.salaryHint;
    salaryHint.classList.remove("is-error");
  } else if (!salaryValid) {
    salaryHint.textContent = STRINGS.salaryInvalid;
    salaryHint.classList.add("is-error");
  } else {
    salaryHint.textContent = "";
    salaryHint.classList.remove("is-error");
  }

  if (loadError) {
    chartUpdated.textContent = "";
    renderAxisLegend(null);
    clearChart();
    showState(STRINGS.errorState);
    return;
  }

  if (dataset) {
    chartUpdated.textContent = `${STRINGS.updatedLabel} ${formatUpdatedAt(dataset.updatedAt)}`;
  } else {
    chartUpdated.textContent = "";
  }

  if (!dataset || !salaryValid) {
    renderAxisLegend(null);
    clearChart();
    return;
  }

  const hourlySalary = toHourly(salary, selectedPeriod);
  const rows = buildRows(dataset.prices, selectedProduct(), hourlySalary);
  if (rows.length === 0) {
    renderAxisLegend(null);
    clearChart();
    showState(STRINGS.noProductData);
    return;
  }

  const maxMinutes = Math.max(...rows.map((r) => r.minutes));
  const axis = computeAxis(maxMinutes / 60);
  renderAxis(axis);
  renderRows(rows, axis.maxTick * 60);
  renderAxisLegend(hourlySalary);
  observeRows();
}

salaryInput.addEventListener("input", render);
periodSelect.addEventListener("change", render);
productOptions.addEventListener("change", render);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const salary = parseSalary(salaryInput.value);
  const valid = salary !== null && Number.isFinite(salary) && salary > 0;
  if (!valid) {
    salaryInput.focus();
    return;
  }
  const top = bars.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
});

toplink.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

loadPrices()
  .then((data) => {
    dataset = data;
  })
  .catch((err: unknown) => {
    loadError = err instanceof Error ? err.message : String(err);
    console.error(err);
  })
  .finally(render);