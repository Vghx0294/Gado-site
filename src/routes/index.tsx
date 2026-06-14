import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beef,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  TrendingUp,
  Syringe,
  Scale,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { loadCattle, saveCattle, uid, type Cattle } from "@/lib/cattle-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle de Gado — Fazenda" },
      {
        name: "description",
        content:
          "Gerencie a entrada e saída do gado: brinco, peso, datas, valores e controle de medicamentos.",
      },
      { property: "og:title", content: "Controle de Gado — Fazenda" },
      {
        property: "og:description",
        content: "App simples para acompanhar o rebanho no dia a dia da fazenda.",
      },
    ],
  }),
  component: CattlePage,
});

type FormState = {
  brinco: string;
  pesoEntrada: string;
  pesoSaida: string;
  dataEntrada: string;
  dataSaida: string;
  valorEntrada: string;
  valorSaida: string;
  remedioFeito: boolean;
};

const emptyForm = (): FormState => ({
  brinco: "",
  pesoEntrada: "",
  pesoSaida: "",
  dataEntrada: new Date().toISOString().slice(0, 10),
  dataSaida: "",
  valorEntrada: "",
  valorSaida: "",
  remedioFeito: false,
});

const fmtBRL = (n: number | null | undefined) =>
  n == null || isNaN(n)
    ? "—"
    : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
};

function CattlePage() {
  const [list, setList] = useState<Cattle[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setList(loadCattle());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCattle(list);
  }, [list, hydrated]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.brinco.toLowerCase().includes(q));
  }, [list, query]);

  const stats = useMemo(() => {
    const total = list.length;
    const ativos = list.filter((c) => !c.dataSaida).length;
    const lucro = list.reduce(
      (acc, c) => acc + ((c.valorSaida ?? 0) - (c.valorEntrada ?? 0)),
      0,
    );
    const ganhoPeso = list.reduce(
      (acc, c) => acc + ((c.pesoSaida ?? 0) - (c.pesoEntrada ?? 0)),
      0,
    );
    return { total, ativos, lucro, ganhoPeso };
  }, [list]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (c: Cattle) => {
    setEditingId(c.id);
    setForm({
      brinco: c.brinco,
      pesoEntrada: String(c.pesoEntrada ?? ""),
      pesoSaida: c.pesoSaida == null ? "" : String(c.pesoSaida),
      dataEntrada: c.dataEntrada,
      dataSaida: c.dataSaida ?? "",
      valorEntrada: String(c.valorEntrada ?? ""),
      valorSaida: c.valorSaida == null ? "" : String(c.valorSaida),
      remedioFeito: c.remedioFeito,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brinco.trim()) {
      toast.error("Informe o número do brinco");
      return;
    }
    if (!form.pesoEntrada || !form.dataEntrada) {
      toast.error("Peso e data de entrada são obrigatórios");
      return;
    }
    const record: Cattle = {
      id: editingId ?? uid(),
      brinco: form.brinco.trim(),
      pesoEntrada: parseFloat(form.pesoEntrada) || 0,
      pesoSaida: form.pesoSaida ? parseFloat(form.pesoSaida) : null,
      dataEntrada: form.dataEntrada,
      dataSaida: form.dataSaida || null,
      valorEntrada: form.valorEntrada ? parseFloat(form.valorEntrada) : 0,
      valorSaida: form.valorSaida ? parseFloat(form.valorSaida) : null,
      remedioFeito: form.remedioFeito,
    };
    setList((prev) => {
      if (editingId) return prev.map((c) => (c.id === editingId ? record : c));
      return [record, ...prev];
    });
    toast.success(editingId ? "Registro atualizado" : "Animal cadastrado");
    setOpen(false);
  };

  const remove = (id: string) => {
    setList((prev) => prev.filter((c) => c.id !== id));
    toast.success("Registro removido");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />

      {/* Hero */}
      <header
        className="relative overflow-hidden text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px, 80px 80px",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Beef className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold">Controle de Gado</h1>
              <p className="text-sm sm:text-base opacity-90">
                Acompanhe o rebanho com facilidade
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <StatCard icon={<Beef className="h-5 w-5" />} label="Total" value={stats.total.toString()} />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="No pasto" value={stats.ativos.toString()} />
            <StatCard icon={<Scale className="h-5 w-5" />} label="Ganho (kg)" value={stats.ganhoPeso.toFixed(0)} />
            <StatCard icon={<CircleDollarSign className="h-5 w-5" />} label="Resultado" value={fmtBRL(stats.lucro)} />
          </motion.div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:flex sm:items-center sm:justify-between gap-3 mb-6">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por brinco..."
              className="pl-9 h-11 bg-card"
            />
          </div>
          <Button onClick={openNew} size="lg" className="shrink-0 gap-2 h-11 shadow-md">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo animal</span>
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onNew={openNew} hasRecords={list.length > 0} />
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.2) }}
                >
                  <CattleCard record={c} onEdit={() => openEdit(c)} onDelete={() => remove(c.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingId ? "Editar animal" : "Novo animal"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize os dados do animal."
                : "Preencha os dados de entrada. Os dados de saída você adiciona depois."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="grid gap-4 mt-2">
            <Field label="Número do brinco" required>
              <Input
                value={form.brinco}
                onChange={(e) => setForm({ ...form, brinco: e.target.value })}
                placeholder="Ex: 0427"
                inputMode="numeric"
              />
            </Field>

            <Field label="Peso entrada (kg)" required>
              <Input
                type="number"
                step="0.1"
                value={form.pesoEntrada}
                onChange={(e) => setForm({ ...form, pesoEntrada: e.target.value })}
                placeholder="320"
              />
            </Field>

            <Field label="Data entrada" required>
              <Input
                type="date"
                value={form.dataEntrada}
                onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })}
              />
            </Field>

            <Field label="Valor entrada (R$)">
              <Input
                type="number"
                step="0.01"
                value={form.valorEntrada}
                onChange={(e) => setForm({ ...form, valorEntrada: e.target.value })}
                placeholder="2500"
              />
            </Field>

            {editingId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="grid gap-4 border-t pt-4"
              >
                <div className="text-sm font-semibold text-primary">Dados de saída</div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data saída">
                    <Input
                      type="date"
                      value={form.dataSaida}
                      onChange={(e) => setForm({ ...form, dataSaida: e.target.value })}
                    />
                  </Field>
                  <Field label="Peso saída (kg)">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.pesoSaida}
                      onChange={(e) => setForm({ ...form, pesoSaida: e.target.value })}
                      placeholder="450"
                    />
                  </Field>
                </div>
                <Field label="Valor saída (R$)">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valorSaida}
                    onChange={(e) => setForm({ ...form, valorSaida: e.target.value })}
                    placeholder="3800"
                  />
                </Field>
              </motion.div>
            )}

            <label className="flex items-center gap-3 rounded-xl border bg-secondary/50 px-4 py-3 cursor-pointer hover:bg-secondary transition-colors">
              <Checkbox
                checked={form.remedioFeito}
                onCheckedChange={(v) => setForm({ ...form, remedioFeito: !!v })}
              />
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Remédio foi aplicado</span>
              </div>
            </label>


            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="shadow-md">
                {editingId ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm px-4 py-3 border border-white/20">
      <div className="flex items-center gap-2 text-xs sm:text-sm opacity-90">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-lg sm:text-2xl font-bold truncate">{value}</div>
    </div>
  );
}

function CattleCard({
  record,
  onEdit,
  onDelete,
}: {
  record: Cattle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ganho =
    record.pesoSaida != null ? record.pesoSaida - record.pesoEntrada : null;
  const lucro =
    record.valorSaida != null ? record.valorSaida - record.valorEntrada : null;
  const ativo = !record.dataSaida;

  return (
    <Card
      className="p-5 transition-all duration-300 hover:-translate-y-1 border-border/70"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Brinco</div>
          <div className="text-2xl font-bold font-display truncate">#{record.brinco}</div>
        </div>
        <Badge
          variant={ativo ? "default" : "secondary"}
          className={
            ativo
              ? "bg-success text-success-foreground hover:bg-success/90"
              : ""
          }
        >
          {ativo ? "No pasto" : "Vendido"}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Info label="Entrada" value={`${record.pesoEntrada} kg`} sub={fmtDate(record.dataEntrada)} />
        <Info
          label="Saída"
          value={record.pesoSaida != null ? `${record.pesoSaida} kg` : "—"}
          sub={fmtDate(record.dataSaida)}
        />
        <Info label="Valor entrada" value={fmtBRL(record.valorEntrada)} />
        <Info label="Valor saída" value={fmtBRL(record.valorSaida)} />
      </div>

      {(ganho != null || lucro != null) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ganho != null && (
            <Badge variant="outline" className="gap-1">
              <Scale className="h-3 w-3" />
              {ganho >= 0 ? "+" : ""}
              {ganho.toFixed(1)} kg
            </Badge>
          )}
          {lucro != null && (
            <Badge
              variant="outline"
              className={`gap-1 ${lucro >= 0 ? "text-success border-success/40" : "text-destructive border-destructive/40"}`}
            >
              <CircleDollarSign className="h-3 w-3" />
              {fmtBRL(lucro)}
            </Badge>
          )}
        </div>
      )}

      {ativo && (
        <Button
          onClick={onEdit}
          variant="outline"
          className="mt-4 w-full gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Plus className="h-4 w-4" />
          Adicionar data de saída
        </Button>
      )}

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Syringe className={`h-4 w-4 ${record.remedioFeito ? "text-success" : "text-muted-foreground"}`} />
          {record.remedioFeito ? (
            <span className="flex items-center gap-1 text-success font-medium">
              <Check className="h-3.5 w-3.5" /> Remédio aplicado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Sem remédio
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} className="h-8 w-8">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-semibold truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
    </div>
  );
}

function EmptyState({ onNew, hasRecords }: { onNew: () => void; hasRecords: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center"
    >
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-primary-foreground mb-4"
        style={{ background: "var(--gradient-hero)" }}
      >
        <Beef className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold">
        {hasRecords ? "Nenhum animal encontrado" : "Comece cadastrando o primeiro animal"}
      </h2>
      <p className="text-muted-foreground mt-1">
        {hasRecords
          ? "Tente buscar por outro número de brinco."
          : "Registre peso, datas, valores e remédio para acompanhar seu rebanho."}
      </p>
      {!hasRecords && (
        <Button onClick={onNew} size="lg" className="mt-6 gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Cadastrar animal
        </Button>
      )}
    </motion.div>
  );
}
