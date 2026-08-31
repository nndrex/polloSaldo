import type { Period } from "./calc";

export const RESTAURANT_NAMES: Record<string, string> = {
  rokys: "Roky's",
  norkys: "Norkys",
  pardos: "Pardo's",
  "villa-chicken": "Villa Chicken",
  primos: "Primos",
  "granja-azul": "Granja Azul",
  tori: "Tori",
};

export const PRODUCT_NAMES: Record<string, string> = {
  "pollo-entero": "Pollo entero",
  "medio-pollo": "1/2 pollo",
  "cuarto-pollo": "1/4 pollo",
};

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Por mes" },
  { value: "day", label: "Por día" },
  { value: "hour", label: "Por hora" },
  { value: "year", label: "Por año" },
];

export const STRINGS = {
  title: "polloSaldo — ¿cuánto trabajo cuesta un pollo a la brasa?",
  description:
    "Calcula cuánto de tu trabajo cuesta un pollo a la brasa según los precios diarios de las pollerías del Perú.",
  heroAria: "polloSaldo — calculadora de minutos de trabajo",
  eyebrow: "Lima, Perú",
  headline:
    "¿Cuántas horas de tu sudor te costaría comerte un pollito a la brasa?",
  lede: "Escribe tu sueldo y mira cuánto de tu tiempo vale cada pollo a la brasa en las pollerías de Lima. Precios reales, actualizados a diario.",
  salaryLabel: "Tu sueldo (S/)",
  salaryPlaceholder: "Ej. 1,500",
  salaryHint: "Escribe tu sueldo mensual y te decimos cuánto trabajo cuesta cada pollo.",
  salaryInvalid: "Ingresa un sueldo mayor a 0 para calcular.",
  periodAria: "Período del sueldo",
  productLabel: "Producto",
  cta: "Calcular",
  orderNote: "Precios reales, actualizados a diario.",
  barsAria: "La tabla — horas de trabajo por pollo",
  chartKicker: "La tabla · Lima",
  chartTitle: "Horas de trabajo por pollo.",
  chartSub:
    "Cuánto de tu tiempo cuesta cada pollo según los precios de hoy, del más barato al más caro.",
  chartCat: "Tiempo",
  axisLabel: "Horas de trabajo / pollo",
  axisLegendSalary: "Horas de trabajo / pollo · S/ {hourly}/h",
  updatedLabel: "Datos actualizados:",
  staleFlag: "(precio con más de 3 días)",
  errorState: "No hay datos disponibles ahora",
  noProductData: "Sin datos para este producto",
  githubUrl: "https://github.com/nndrex/polloSaldo",
  githubLabel: "GitHub",
  backToTop: "Volver ↑",
} as const;