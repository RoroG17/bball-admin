// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PasswordField } from "@/components/ui/PasswordField";

describe("PasswordField", () => {
  it("masqué par défaut, libellé associé, jamais pré-rempli", () => {
    render(<PasswordField label="Mot de passe" name="password" autoComplete="current-password" />);
    const input = screen.getByLabelText("Mot de passe");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "current-password");
    expect(input).toHaveValue("");
  });

  it("« Afficher » bascule en clair, puis « Masquer » rétablit", async () => {
    render(<PasswordField label="Mot de passe" name="password" autoComplete="current-password" />);
    const toggle = screen.getByRole("button", { name: "Afficher le mot de passe" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "text");
    const pressed = screen.getByRole("button", { name: "Masquer le mot de passe" });
    expect(pressed).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(pressed);
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
  });

  it("le bouton n'envoie pas le formulaire, et l'envoi remasque le champ", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <PasswordField label="Mot de passe" name="password" autoComplete="current-password" />
        <button type="submit">Envoyer</button>
      </form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
  });

  it("annonce l'aide, l'erreur et les ids fournis", () => {
    render(
      <>
        <p id="rule">Règle</p>
        <PasswordField
          label="Nouveau mot de passe"
          name="password"
          autoComplete="new-password"
          describedBy="rule"
          hint="Aide"
          error="Trop court."
        />
      </>,
    );
    const input = screen.getByLabelText("Nouveau mot de passe");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Règle Aide Trop court.");
  });
});
