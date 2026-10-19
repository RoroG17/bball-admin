// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { InitPasswordState } from "@/models/InitPasswordState";
import { PASSWORD_RULE_TEXT } from "@/models/PasswordRule";
import { InitPasswordForm } from "@/views/init-password/components/InitPasswordForm";

const action = vi.hoisted(() => vi.fn());
vi.mock("@/actions/authActions", () => ({ initPassword: action }));

beforeEach(() => {
  action.mockReset();
});

describe("InitPasswordForm", () => {
  it("affiche le compte, le lien pour changer d'identifiant et la règle avant les champs", () => {
    render(<InitPasswordForm username="theo.bernard" redirectTo="/" />);
    expect(screen.getByText("theo.bernard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ce n'est pas toi ? Changer d'identifiant" })).toHaveAttribute(
      "href",
      "/login",
    );
    const rule = screen.getByText(PASSWORD_RULE_TEXT);
    const password = screen.getByLabelText("Nouveau mot de passe");
    expect(rule.compareDocumentPosition(password) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(password).toHaveAccessibleDescription(PASSWORD_RULE_TEXT);
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirmer le mot de passe")).toHaveAttribute("autocomplete", "new-password");
  });

  it("n'envoie jamais l'identifiant : le champ de confort n'a pas de nom", () => {
    const { container } = render(<InitPasswordForm username="theo.bernard" redirectTo="/" />);
    const comfort = container.querySelector('input[autocomplete="username"]');
    expect(comfort).toHaveValue("theo.bernard");
    expect(comfort).not.toHaveAttribute("name");
    expect(container.querySelector('input[name="username"]')).toBeNull();
  });

  it("erreurs de champ rattachées au bon champ, focus sur le premier en erreur", async () => {
    const state: InitPasswordState = {
      status: "error",
      message: null,
      fieldErrors: { confirmation: "Les deux mots de passe ne sont pas identiques." },
    };
    action.mockResolvedValue(state);
    render(<InitPasswordForm username="theo.bernard" redirectTo="/" />);
    await userEvent.click(screen.getByRole("button", { name: "Définir mon mot de passe" }));

    const confirmation = await screen.findByLabelText("Confirmer le mot de passe");
    await waitFor(() => expect(confirmation).toHaveAttribute("aria-invalid", "true"));
    expect(confirmation).toHaveAccessibleDescription("Les deux mots de passe ne sont pas identiques.");
    expect(confirmation).toHaveFocus();
    expect(screen.getByLabelText("Nouveau mot de passe")).not.toHaveAttribute("aria-invalid");
  });

  it("erreur globale annoncée", async () => {
    action.mockResolvedValue({
      status: "error",
      message: "Impossible de définir le mot de passe pour le moment. Réessaie dans un instant.",
      fieldErrors: {},
    } satisfies InitPasswordState);
    render(<InitPasswordForm username="theo.bernard" redirectTo="/" />);
    await userEvent.click(screen.getByRole("button", { name: "Définir mon mot de passe" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de définir le mot de passe");
  });
});
