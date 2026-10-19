// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AddMeasurementState } from "@/models/AddMeasurementState";
import { AddMeasurementForm } from "@/views/player-detail/components/AddMeasurementForm";

const action = vi.hoisted(() => vi.fn());
vi.mock("@/actions/physicalMeasurementActions", () => ({ addPhysicalMeasurement: action }));

const onSuccess = vi.fn();
const onCancel = vi.fn();
const renderForm = () => render(<AddMeasurementForm licence="LIC1000" today="2026-03-12" onSuccess={onSuccess} onCancel={onCancel} />);

const failure = (overrides: Partial<Extract<AddMeasurementState, { status: "error" }>> = {}): AddMeasurementState => ({
  status: "error",
  message: null,
  fieldErrors: {},
  values: { date: "2026-03-10", type: "verticalJump", value: "200" },
  ...overrides,
});

beforeEach(() => {
  action.mockReset();
  onSuccess.mockClear();
  onCancel.mockClear();
});

describe("AddMeasurementForm", () => {
  it("chaque champ a son libellé ; la date est bornée au jour ; la licence part en champ caché", () => {
    const { container } = renderForm();
    expect(screen.getByLabelText("Date de la mesure")).toHaveAttribute("max", "2026-03-12");
    expect(screen.getByLabelText("Mesure")).toBeInTheDocument();
    expect(screen.getByLabelText("Valeur")).toHaveAttribute("inputmode", "decimal");
    expect(container.querySelector("input[name=licence]")).toHaveValue("LIC1000");
    expect(screen.getByText("Choisis d'abord une mesure.")).toBeInTheDocument();
  });

  it("propose les trois mesures avec leur unité, et l'aide suit le choix", async () => {
    renderForm();
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Choisis une mesure",
      "Taille (cm)",
      "Détente (cm)",
      "VMA (km/h)",
    ]);
    await userEvent.selectOptions(screen.getByLabelText("Mesure"), "vma");
    expect(screen.getByText("Entre 5 et 25 km/h.")).toBeInTheDocument();
    expect(screen.getByText("km/h", { selector: "span" })).toBeInTheDocument();
  });

  it("Annuler appelle onCancel sans envoyer", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(action).not.toHaveBeenCalled();
  });

  it("envoie la saisie à l'action", async () => {
    action.mockResolvedValue({ status: "idle" });
    renderForm();
    await userEvent.type(screen.getByLabelText("Date de la mesure"), "2026-03-10");
    await userEvent.selectOptions(screen.getByLabelText("Mesure"), "verticalJump");
    await userEvent.type(screen.getByLabelText("Valeur"), "62,5");
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(action).toHaveBeenCalledOnce();
    const formData = action.mock.calls[0][1] as FormData;
    expect(Object.fromEntries(formData)).toEqual({ licence: "LIC1000", date: "2026-03-10", type: "verticalJump", value: "62,5" });
  });

  it("erreurs de champ : sous le champ, aria-invalid, aria-describedby, saisie conservée, focus sur le premier invalide", async () => {
    action.mockResolvedValue(
      failure({ fieldErrors: { value: "La détente doit être comprise entre 5 et 120 cm." } }),
    );
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByText("La détente doit être comprise entre 5 et 120 cm.")).toBeInTheDocument();
    const value = screen.getByLabelText("Valeur");
    expect(value).toHaveAttribute("aria-invalid", "true");
    expect(value.getAttribute("aria-describedby")).toMatch(/-help .*-error$/);
    expect(value).toHaveValue("200");
    expect(screen.getByLabelText("Mesure")).toHaveValue("verticalJump");
    expect(screen.getByLabelText("Date de la mesure")).toHaveValue("2026-03-10");
    expect(value).toHaveFocus();
    expect(screen.getByLabelText("Date de la mesure")).not.toHaveAttribute("aria-invalid");
  });

  it("message global annoncé en alerte", async () => {
    action.mockResolvedValue(failure({ message: "Échec de l'enregistrement. Vérifie ta connexion puis réessaie." }));
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Échec de l'enregistrement.");
  });

  it("succès : onSuccess est appelé", async () => {
    action.mockResolvedValue({
      status: "success",
      measurement: { id: "1", date: "2026-03-10", type: "verticalJump", value: 62.5 },
    });
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("pendant l'envoi : bouton désactivé et libellé « Enregistrement… »", async () => {
    let resolve: (state: AddMeasurementState) => void = () => {};
    action.mockReturnValue(new Promise<AddMeasurementState>((done) => (resolve = done)));
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    const pending = await screen.findByRole("button", { name: "Enregistrement…" });
    expect(pending).toBeDisabled();
    resolve({ status: "idle" });
    expect(await screen.findByRole("button", { name: "Enregistrer" })).toBeEnabled();
  });
});
