// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";

describe("TextField", () => {
  it("reste un champ texte par défaut, libellé associé", () => {
    render(<TextField label="Nom" name="name" />);
    expect(screen.getByLabelText("Nom")).toHaveAttribute("type", "text");
  });

  it("accepte type, required, readOnly, inputMode, min et max", () => {
    render(
      <TextField label="Année" name="year" type="number" required readOnly inputMode="numeric" min={1990} max={2100} />,
    );
    const input = screen.getByLabelText(/Année/);
    expect(input).toHaveAttribute("type", "number");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("min", "1990");
    expect(input).toHaveAttribute("max", "2100");
  });

  it("relie l'erreur et l'aide au champ", () => {
    render(<TextField label="Nom" name="name" error="Trop court" hint="2 lettres minimum" />);
    const input = screen.getByLabelText("Nom");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("2 lettres minimum Trop court");
  });
});

describe("SelectField", () => {
  const options = [
    { value: "1", label: "Colomiers" },
    { value: "2", label: "Toulouse" },
  ];

  it("label associé, options et valeur par défaut", () => {
    render(<SelectField label="Équipe" name="team" options={options} defaultValue="2" required />);
    const select = screen.getByLabelText(/Équipe/);
    expect(select).toHaveValue("2");
    expect(select).toBeRequired();
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Colomiers", "Toulouse"]);
  });

  it("option vide en première position avec un placeholder", () => {
    render(<SelectField label="Équipe" name="team" options={options} placeholder="Choisir…" />);
    expect(screen.getByLabelText("Équipe")).toHaveValue("");
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Choisir…");
  });

  it("relie l'erreur et l'aide au champ", () => {
    render(<SelectField label="Équipe" name="team" options={options} error="Obligatoire" hint="Une équipe du club" />);
    const select = screen.getByLabelText("Équipe");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Une équipe du club Obligatoire");
  });
});

describe("PrimaryButton variant danger", () => {
  it("rend un bouton danger avec son libellé", () => {
    render(<PrimaryButton variant="danger">Supprimer définitivement</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Supprimer définitivement" });
    expect(button.className).toContain("bg-danger");
  });

  it("busy : désactivé, aria-busy, fond encre et non bordeaux", () => {
    render(
      <PrimaryButton variant="danger" busy>
        Supprimer
      </PrimaryButton>,
    );
    const button = screen.getByRole("button", { name: "Supprimer" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.className).toContain("aria-busy:bg-rpb-ink");
    expect(button.className).not.toContain("aria-busy:bg-rpb-bordeaux-dark");
  });

  it("les autres variantes gardent leur fond occupé", () => {
    render(
      <PrimaryButton busy>
        Enregistrer
      </PrimaryButton>,
    );
    expect(screen.getByRole("button", { name: "Enregistrer" }).className).toContain("aria-busy:bg-rpb-bordeaux-dark");
  });
});
