import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Beef,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  CircleAlert,
  TrendingUp,
  Syringe,
  X,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  type Animal,
  loadAnimals,
  saveAnimals,
  formatBRL,
  formatDate,
} from "@/lib/cattle-storage";

type Filter = "todos" | "pasto" | "vendidos" | "pendente";

function emptyAnimal(): Animal {
  return {
    id: crypto.randomUUID(),
    brinco: "",
    dataEntrada: new Date().toISOString().slice(0, 10),
    pesoEntrada: 0,
    valorEntrada: 0,
    medicado: false,
  };
}

export function CattleApp() {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [editing, setEditing] = useState<Animal | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAnimals(loadAnimals());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveAnimals(animals);
  }, [animals, loaded]);

  const stats = useMemo(() => {
    const ativos = animals.filter((a) => !a.dataSaida).length;
    const vendidos = animals.filter((a) => a.dataSaida).length;
    const medicados = animals.filter((a) => a.medicado).length;
    const investido = animals.reduce((s, a) => s + (a.valorEntrada || 0), 0);
    const retorno = animals.reduce((s, a) => s + (a.valorSaida || 0), 0);
    return { ativos, vendidos, medicados, lucro: retorno - investido, total: animals.length };
  }, [animals]);

  const filtered = useMemo(() => {
    return animals.filter((a) => {
      if (query && !a.brinco.toLowerCase().includes(query.toLowerCase())) return false;
      if (filter === "pasto" && a.dataSaida) return false;
      if (filter === "vendidos" && !a.dataSaida) return false;
      if (filter === "pendente" && a.medicado) return false;
      return true;
    });
  }, [animals, query, filter]);

  function upsert(a: Animal) {
    setAnimals((prev) => {
      const idx = prev.findIndex((x) => x.id === a.id);
      if (idx === -1) return [a, ...prev];
      const copy = [...prev];
      copy[idx] = a;
      return copy;
    });
    toast.success("Animal salvo");
    setEditing(null);
  }

  function remove(id: string) {
    setAnimals((p) => p.filter((a) => a.id !== id));
    toast.success("Animal removido");
  }

  function toggleMed(a: Animal) {
    setAnimals((p) => p.map((x) => (x.id === a.id ? { ...x, medicado: !x.medicado } : x)));
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 py-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Beef className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg sm:text-xl font-bold">Pasto Vivo</h1>
              <p className="truncate text-xs text-muted-foreground">
                Gestão simples do seu rebanho
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditing(emptyAnimal())}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 active:scale-[.98] transition"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo animal</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Dashboard */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="No pasto"
            value={stats.ativos.toString()}
            sub={`${stats.total} no total`}
            icon={<Beef className="h-5 w-5" />}
            tone="primary"
          />
          <StatCard
            label="Vendidos"
            value={stats.vendidos.toString()}
            sub="animais com saída"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="earth"
          />
          <StatCard
            label="Medicados"
            value={`${stats.medicados}/${stats.total}`}
            sub={`${stats.total - stats.medicados} pendentes`}
            icon={<Syringe className="h-5 w-5" />}
            tone="warning"
          />
          <StatCard
            label="Lucro estimado"
            value={formatBRL(stats.lucro)}
            sub="saída − entrada"
            icon={<TrendingUp className="h-5 w-5" />}
            tone={stats.lucro >= 0 ? "success" : "destructive"}
          />
        </section>

        {/* Filtros */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nº do brinco..."
              className="w-full rounded-xl border border-input bg-card pl-10 pr-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring/40 transition"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
            {(
              [
                ["todos", "Todos"],
                ["pasto", "No pasto"],
                ["vendidos", "Vendidos"],
                ["pendente", "Remédio pendente"],
              ] as [Filter, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  filter === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground border border-border hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState onAdd={() => setEditing(emptyAnimal())} hasAny={animals.length > 0} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Brinco</th>
                    <th className="px-4 py-3 font-medium">Entrada</th>
                    <th className="px-4 py-3 font-medium">Peso E.</th>
                    <th className="px-4 py-3 font-medium">Valor E.</th>
                    <th className="px-4 py-3 font-medium">Saída</th>
                    <th className="px-4 py-3 font-medium">Valor S.</th>
                    <th className="px-4 py-3 font-medium">Remédio</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((a) => (
                      <motion.tr
                        key={a.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="border-t border-border hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <BrincoBadge value={a.brinco} />
                        </td>
                        <td className="px-4 py-3">{formatDate(a.dataEntrada)}</td>
                        <td className="px-4 py-3">{a.pesoEntrada} kg</td>
                        <td className="px-4 py-3">{formatBRL(a.valorEntrada)}</td>
                        <td className="px-4 py-3">{formatDate(a.dataSaida)}</td>
                        <td className="px-4 py-3">{formatBRL(a.valorSaida)}</td>
                        <td className="px-4 py-3">
                          <MedToggle a={a} onToggle={() => toggleMed(a)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <RowActions onEdit={() => setEditing(a)} onDelete={() => remove(a.id)} />
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              <AnimatePresence initial={false}>
                {filtered.map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <BrincoBadge value={a.brinco} large />
                      <RowActions onEdit={() => setEditing(a)} onDelete={() => remove(a.id)} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <Info label="Entrada" value={formatDate(a.dataEntrada)} />
                      <Info label="Peso E." value={`${a.pesoEntrada} kg`} />
                      <Info label="Valor E." value={formatBRL(a.valorEntrada)} />
                      <Info label="Saída" value={formatDate(a.dataSaida)} />
                      <Info label="Peso S." value={a.pesoSaida ? `${a.pesoSaida} kg` : "—"} />
                      <Info label="Valor S." value={formatBRL(a.valorSaida)} />
                    </div>
                    <div className="mt-3">
                      <MedToggle a={a} onToggle={() => toggleMed(a)} full />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        <footer className="pt-6 pb-10 text-center text-xs text-muted-foreground">
          Dados salvos localmente no seu dispositivo.
        </footer>
      </main>

      <AnimatePresence>
        {editing && (
          <AnimalModal
            key="modal"
            animal={editing}
            onClose={() => setEditing(null)}
            onSave={upsert}
            existingBrincos={animals.filter((x) => x.id !== editing.id).map((x) => x.brinco)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: "primary" | "earth" | "warning" | "success" | "destructive";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary text-primary-foreground",
    earth: "bg-earth text-earth-foreground",
    warning: "bg-warning text-warning-foreground",
    success: "bg-success text-success-foreground",
    destructive: "bg-destructive text-destructive-foreground",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${toneMap[tone]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
    </motion.div>
  );
}

function BrincoBadge({ value, large }: { value: string; large?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-accent text-accent-foreground font-bold ${
        large ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-sm"
      }`}
    >
      <span className="text-muted-foreground font-normal">#</span>
      {value || "—"}
    </span>
  );
}

function MedToggle({ a, onToggle, full }: { a: Animal; onToggle: () => void; full?: boolean }) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        full ? "w-full justify-center py-2.5 text-sm" : ""
      } ${
        a.medicado
          ? "bg-success/15 text-success border border-success/30"
          : "bg-warning/15 text-warning-foreground border border-warning/40"
      }`}
    >
      {a.medicado ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
      {a.medicado ? "Medicado" : "Pendente"}
    </button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={onEdit}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
        aria-label="Editar"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={onDelete}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
        aria-label="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd, hasAny }: { onAdd: () => void; hasAny: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-dashed border-border bg-card/60 py-14 px-6 text-center"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Beef className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {hasAny ? "Nenhum resultado" : "Comece cadastrando seu primeiro animal"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAny
          ? "Tente ajustar a busca ou os filtros."
          : "Registre a entrada do gado e acompanhe tudo daqui."}
      </p>
      {!hasAny && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Cadastrar animal
        </button>
      )}
    </motion.div>
  );
}

function AnimalModal({
  animal,
  onClose,
  onSave,
  existingBrincos,
}: {
  animal: Animal;
  onClose: () => void;
  onSave: (a: Animal) => void;
  existingBrincos: string[];
}) {
  const [form, setForm] = useState<Animal>(animal);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof Animal>(k: K, v: Animal[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.brinco.trim()) return setErr("Informe o número do brinco");
    if (existingBrincos.includes(form.brinco.trim()))
      return setErr("Já existe um animal com esse brinco");
    onSave({
      ...form,
      brinco: form.brinco.trim(),
      pesoEntrada: Number(form.pesoEntrada) || 0,
      valorEntrada: Number(form.valorEntrada) || 0,
      pesoSaida: form.pesoSaida ? Number(form.pesoSaida) : undefined,
      valorSaida: form.valorSaida ? Number(form.valorSaida) : undefined,
      dataSaida: form.dataSaida || undefined,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full sm:max-w-xl bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border max-h-[92vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {existingBrincos.length === 0 || !animal.brinco ? "Novo animal" : `Editar #${animal.brinco}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <Section title="Identificação">
            <Field label="Número do brinco" required>
              <input
                value={form.brinco}
                onChange={(e) => set("brinco", e.target.value)}
                placeholder="Ex: 1024"
                className="field"
                autoFocus
              />
            </Field>
          </Section>

          <Section title="Entrada">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Data">
                <input
                  type="date"
                  value={form.dataEntrada}
                  onChange={(e) => set("dataEntrada", e.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Peso (kg)">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.pesoEntrada || ""}
                  onChange={(e) => set("pesoEntrada", Number(e.target.value))}
                  className="field"
                />
              </Field>
              <Field label="Valor (R$)">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.valorEntrada || ""}
                  onChange={(e) => set("valorEntrada", Number(e.target.value))}
                  className="field"
                />
              </Field>
            </div>
          </Section>

          <Section title="Saída (opcional)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Data">
                <input
                  type="date"
                  value={form.dataSaida || ""}
                  onChange={(e) => set("dataSaida", e.target.value)}
                  className="field"
                />
              </Field>
              <Field label="Peso (kg)">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.pesoSaida || ""}
                  onChange={(e) => set("pesoSaida", Number(e.target.value))}
                  className="field"
                />
              </Field>
              <Field label="Valor (R$)">
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.valorSaida || ""}
                  onChange={(e) => set("valorSaida", Number(e.target.value))}
                  className="field"
                />
              </Field>
            </div>
          </Section>

          <Section title="Sanidade">
            <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4 cursor-pointer">
              <div>
                <div className="font-medium">Medicado</div>
                <div className="text-xs text-muted-foreground">
                  Marque quando o protocolo for aplicado
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.medicado}
                onChange={(e) => set("medicado", e.target.checked)}
                className="h-6 w-6 accent-[oklch(0.42_0.09_150)]"
              />
            </label>
          </Section>

          {err && (
            <div className="rounded-lg bg-destructive/10 text-destructive text-sm px-3 py-2">
              {err}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-[1.5] rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95 active:scale-[.98] transition"
          >
            Salvar animal
          </button>
        </div>

        <style>{`.field{width:100%;border:1px solid var(--input);background:var(--card);border-radius:0.75rem;padding:0.75rem 0.875rem;font-size:1rem;outline:none;transition:box-shadow .15s,border-color .15s}.field:focus{border-color:var(--ring);box-shadow:0 0 0 3px color-mix(in oklch, var(--ring) 30%, transparent)}`}</style>
      </motion.form>
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
