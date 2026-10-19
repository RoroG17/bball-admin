// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogSourceBadge } from "@/views/admin-logs/components/LogSourceBadge";
import { LogStatusBadge } from "@/views/admin-logs/components/LogStatusBadge";

describe("LogStatusBadge", () => {
  it.each([
    [200, "Succès"],
    [301, "Redirection"],
    [404, "Erreur client"],
    [500, "Erreur serveur"],
  ])("%i : code, libellé de classe et icône (jamais la couleur seule)", (code, label) => {
    const { container } = render(<LogStatusBadge statusCode={code} />);
    expect(screen.getByText(String(code))).toBeInTheDocument();
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("sans statut : tiret et texte pour lecteurs d'écran", () => {
    const { container } = render(<LogStatusBadge statusCode={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Sans statut HTTP")).toHaveClass("sr-only");
    expect(container.querySelector("svg")).toBeNull();
  });
});

describe("LogSourceBadge", () => {
  it("client : texte et indice", () => {
    render(<LogSourceBadge source="client" />);
    expect(screen.getByText("Client")).toHaveAttribute("title", "Erreur remontée par une application");
  });

  it("serveur : texte et indice", () => {
    render(<LogSourceBadge source="server" />);
    expect(screen.getByText("Serveur")).toHaveAttribute("title", "Erreur HTTP renvoyée par l'API");
  });
});
