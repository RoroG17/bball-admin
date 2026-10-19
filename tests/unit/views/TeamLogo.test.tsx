// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminForm } from "@/components/admin/AdminForm";
import { TeamLogo } from "@/components/ui/TeamLogo";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { TeamLogoField } from "@/views/admin-team/components/TeamLogoField";
import { TeamLogoPreview } from "@/views/admin-team/components/TeamLogoPreview";

const BASE = "http://api.test/public/images/logo/";

describe("TeamLogo : repli sur les initiales", () => {
  it("image chargée tant qu'aucune erreur", () => {
    render(<TeamLogo name="US Colomiers" logoUrl={`${BASE}a.png`} isRpb={false} context="list" decorative />);
    expect(document.querySelector("img")).not.toBeNull();
  });

  it("fichier introuvable : initiales à la place, aucune image cassée", () => {
    render(<TeamLogo name="US Colomiers" logoUrl={`${BASE}a.png`} isRpb={false} context="list" />);
    fireEvent.error(document.querySelector("img") as HTMLImageElement);
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByText("USC")).toBeInTheDocument();
    expect(screen.getByText("Logo US Colomiers")).toBeInTheDocument();
  });

  it("pas de logo : initiales", () => {
    render(<TeamLogo name="OTB" logoUrl={null} isRpb={false} context="preview" decorative />);
    expect(screen.getByText("OTB")).toBeInTheDocument();
  });
});

describe("TeamLogoPreview", () => {
  it("champ vide : initiales, « Aucun logo », aucune requête", () => {
    render(<TeamLogoPreview file="" name="OTB" baseUrl={BASE} />);
    expect(screen.getByText("Aucun logo")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("nom invalide : aucune image rendue", () => {
    render(<TeamLogoPreview file="a/b.png" name="OTB" baseUrl={BASE} />);
    expect(document.querySelector("img")).toBeNull();
  });

  it("nom valide : image d'aperçu avec l'URL attendue", () => {
    render(<TeamLogoPreview file="logo colomiers.png" name="OTB" baseUrl={BASE} />);
    const image = screen.getByRole("img", { name: "Aperçu du logo" });
    expect(image).toHaveAttribute("src", `${BASE}logo%20colomiers.png`);
  });

  it("erreur de chargement : initiales et avertissement dans role=status ; un autre fichier réinitialise", () => {
    const { rerender } = render(<TeamLogoPreview file="inconnu.png" name="OTB" baseUrl={BASE} />);
    fireEvent.error(screen.getByRole("img", { name: "Aperçu du logo" }));
    expect(screen.getByRole("status")).toHaveTextContent("Aucun fichier de ce nom sur le serveur");
    expect(screen.queryByRole("img", { name: "Aperçu du logo" })).toBeNull();
    rerender(<TeamLogoPreview file="autre.png" name="OTB" baseUrl={BASE} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("img", { name: "Aperçu du logo" })).toBeInTheDocument();
  });
});

describe("TeamLogoField", () => {
  it("le champ a un libellé ; l'aperçu ne change qu'à la perte de focus", async () => {
    render(
      <AdminForm action={async () => IDLE_FORM_STATE} submitLabel="OK" busyLabel="…" cancelHref="/x">
        <TeamLogoField defaultValue="" previewName="OTB" logoBaseUrl={BASE} />
      </AdminForm>,
    );
    const field = screen.getByRole("textbox", { name: "Logo (nom de fichier)" });
    await userEvent.type(field, "logo_a.png");
    expect(screen.queryByRole("img", { name: "Aperçu du logo" })).toBeNull();
    await userEvent.tab();
    expect(screen.getByRole("img", { name: "Aperçu du logo" })).toBeInTheDocument();
  });
});
