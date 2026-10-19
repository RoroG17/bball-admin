// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameDetailError } from "@/views/game-detail/components/GameDetailError";

describe("GameDetailError", () => {
  it("annonce l'erreur, relance au clic et propose le retour au calendrier", async () => {
    const onRetry = vi.fn();
    render(<GameDetailError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de charger le match");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Retour au calendrier" })).toHaveAttribute("href", "/game");
  });
});
