export type Animal = {
  id: string;
  brinco: string;
  dataEntrada: string;
  pesoEntrada: number;
  valorEntrada: number;
  dataSaida?: string;
  pesoSaida?: number;
  valorSaida?: number;
  medicado: boolean;
};

const KEY = "cattle.animals.v1";

export function loadAnimals(): Animal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Animal[];
  } catch {
    return [];
  }
}

export function saveAnimals(animals: Animal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(animals));
}

export function formatBRL(v: number | undefined | null) {
  if (v == null || isNaN(v)) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(d: string | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y) return d;
  return `${day}/${m}/${y}`;
}
