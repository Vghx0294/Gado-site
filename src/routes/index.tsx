import { createFileRoute } from "@tanstack/react-router";
import { CattleApp } from "@/components/cattle-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pasto Vivo — Gestão de Gado" },
      {
        name: "description",
        content:
          "Gerencie seu rebanho de forma simples: brincos, entradas, saídas, medicação e lucro estimado.",
      },
      { property: "og:title", content: "Pasto Vivo — Gestão de Gado" },
      {
        property: "og:description",
        content: "Controle entradas, saídas, medicação e lucro do seu gado em um só lugar.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CattleApp,
});
