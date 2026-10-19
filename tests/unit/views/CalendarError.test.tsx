// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarError } from "@/views/calendar/components/CalendarError";

describe("CalendarError", () => {
  it("annonce l'erreur et relance au clic", async () => {
    const onRetry = vi.fn();
    render(<CalendarError onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Impossible de charger le calendrier");
    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
