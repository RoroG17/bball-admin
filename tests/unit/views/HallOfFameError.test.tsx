// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HallOfFameError } from "@/views/hall-of-fame/components/HallOfFameError";

describe("HallOfFameError", () => {
  it("annonce l'erreur et relance au clic", async () => {
    const onRetry = vi.fn();
    render(<HallOfFameError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de charger le palmarès");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
