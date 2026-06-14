export type Cattle = {
  id: string;
  brinco: string;
  pesoEntrada: number;
  pesoSaida: number | null;
  dataEntrada: string; // ISO date
  dataSaida: string | null;
  valorEntrada: number;
  valorSaida: number | null;
  remedioFeito: boolean;
};

const KEY = "cattle.records.v1";

export function loadCattle(): Cattle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Cattle[]) : [];
  } catch {
    return [];
  }
}

export function saveCattle(list: Cattle[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
