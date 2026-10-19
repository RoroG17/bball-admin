// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlayerDetailError } from "@/views/player-detail/components/PlayerDetailError";
import { PlayerNotFound } from "@/views/player-detail/components/PlayerNotFound";
import { PlayerListError } from "@/views/player-list/components/PlayerListError";

describe("PlayerListError", () => {
  it("annonce l'erreur et relance au clic, sans message technique", async () => {
    const onRetry = vi.fn();
    render(<PlayerListError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de charger les joueurs");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("PlayerDetailError", () => {
  it("annonce l'erreur, relance au clic et propose le retour à l'effectif", async () => {
    const onRetry = vi.fn();
    render(<PlayerDetailError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de charger ce joueur");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Retour à l'effectif" })).toHaveAttribute("href", "/player");
  });
});

describe("PlayerNotFound", () => {
  it("dit que le joueur n'existe pas sans rien révéler", () => {
    render(<PlayerNotFound />);
    expect(screen.getByRole("heading", { level: 1, name: "Ce joueur n'existe pas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'effectif" })).toHaveAttribute("href", "/player");
  });
});
