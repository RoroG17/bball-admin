// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoginState } from "@/models/LoginState";
import { LoginForm } from "@/views/login/components/LoginForm";

const action = vi.hoisted(() => vi.fn());
vi.mock("@/actions/authActions", () => ({ login: action }));

const failure = (overrides: Partial<Extract<LoginState, { status: "error" }>> = {}): LoginState => ({
  status: "error",
  reason: "invalidCredentials",
  message: "Identifiant ou mot de passe incorrect.",
  fieldErrors: {},
  values: { username: "theo.bernard" },
  ...overrides,
});

beforeEach(() => {
  action.mockReset();
});

describe("LoginForm", () => {
  it("champs, autocomplétion, focus initial et page de retour", () => {
    const { container } = render(<LoginForm redirectTo="/game?saison=4" />);
    const username = screen.getByLabelText("Identifiant");
    expect(username).toHaveFocus();
    expect(username).toHaveAttribute("autocomplete", "username");
    expect(username).toHaveAttribute("autocapitalize", "none");
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByText("Première connexion ? Laisse le mot de passe vide.")).toBeInTheDocument();
    expect(container.querySelector("input[name=redirect]")).toHaveValue("/game?saison=4");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("pendant l'envoi : bouton désactivé et libellé « Connexion en cours… »", async () => {
    let resolve: (state: LoginState) => void = () => undefined;
    action.mockReturnValue(new Promise<LoginState>((done) => (resolve = done)));
    render(<LoginForm redirectTo="/" />);
    await userEvent.type(screen.getByLabelText("Identifiant"), "theo.bernard");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    const busy = await screen.findByRole("button", { name: "Connexion en cours…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    resolve(failure());
    await screen.findByRole("button", { name: "Se connecter" });
  });

  it("erreur : alerte, identifiant conservé, mot de passe vidé, focus sur l'identifiant", async () => {
    action.mockResolvedValue(failure());
    render(<LoginForm redirectTo="/" />);
    await userEvent.type(screen.getByLabelText("Identifiant"), "theo.bernard");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "mauvais");
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Identifiant ou mot de passe incorrect.");
    expect(screen.getByLabelText("Identifiant")).toHaveValue("theo.bernard");
    expect(screen.getByLabelText("Mot de passe")).toHaveValue("");
    await waitFor(() => expect(screen.getByLabelText("Identifiant")).toHaveFocus());
  });

  it("identifiant vide : erreur de champ, sans alerte globale", async () => {
    action.mockResolvedValue(
      failure({
        reason: "invalidInput",
        message: "Saisis ton identifiant.",
        fieldErrors: { username: "Saisis ton identifiant." },
        values: { username: "" },
      }),
    );
    render(<LoginForm redirectTo="/" />);
    await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    const username = await screen.findByLabelText("Identifiant");
    await waitFor(() => expect(username).toHaveAttribute("aria-invalid", "true"));
    expect(username).toHaveAccessibleDescription("Saisis ton identifiant.");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
