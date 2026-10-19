// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminForm } from "@/components/admin/AdminForm";
import { IDLE_FORM_STATE } from "@/models/FormState";
import { resolvePhotoPreview } from "@/models/resolvePhotoPreview";
import { PlayerPhotoField } from "@/views/admin-player/components/PlayerPhotoField";
import { PlayerPhotoPreview } from "@/views/admin-player/components/PlayerPhotoPreview";

const BASE = "http://api.test/public/images/joueur/";
const PLAYER = { firstName: "Paul", lastName: "Durand" };
const preview = (file: string) => resolvePhotoPreview(BASE, file);
const photo = () => document.querySelector("img");

describe("PlayerPhotoPreview", () => {
  it("aucune photo : initiales du joueur, message, aucune image", () => {
    render(<PlayerPhotoPreview preview={preview("")} player={PLAYER} />);
    expect(screen.getByRole("status")).toHaveTextContent("Aucune photo : les initiales seront affichées.");
    expect(photo()).toBeNull();
    expect(screen.getByText("PD")).toBeInTheDocument();
  });

  it("nom invalide : message sans chargement d'image", () => {
    render(<PlayerPhotoPreview preview={preview("a/b.png")} player={PLAYER} />);
    expect(screen.getByRole("status")).toHaveTextContent("Nom de fichier non valide");
    expect(photo()).toBeNull();
  });

  it("nom valide : image avec l'URL attendue et message de chargement", () => {
    render(<PlayerPhotoPreview preview={preview("durand.png")} player={PLAYER} />);
    expect(photo()).toHaveAttribute("src", `${BASE}durand.png`);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement de l'aperçu…");
  });

  it("chargée : « Aperçu de la photo » avec le nom du fichier", async () => {
    render(<PlayerPhotoPreview preview={preview("durand.png")} player={PLAYER} />);
    fireEvent.load(photo() as HTMLImageElement);
    // `next/image` rend le résultat du chargement de façon asynchrone (décodage).
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Aperçu de la photo « durand.png »."));
    expect(photo()).not.toBeNull();
  });

  it("introuvable : avertissement dans role=status et repli sur les initiales", () => {
    render(<PlayerPhotoPreview preview={preview("inconnu.png")} player={PLAYER} />);
    fireEvent.error(photo() as HTMLImageElement);
    expect(screen.getByRole("status")).toHaveTextContent("Image introuvable sur le serveur");
    expect(photo()).toBeNull();
    expect(screen.getByText("PD")).toBeInTheDocument();
  });

  it("un autre fichier réinitialise l'état", () => {
    const { rerender } = render(<PlayerPhotoPreview preview={preview("inconnu.png")} player={PLAYER} />);
    fireEvent.error(photo() as HTMLImageElement);
    rerender(<PlayerPhotoPreview preview={preview("autre.png")} player={PLAYER} />);
    expect(screen.getByRole("status")).toHaveTextContent("Chargement de l'aperçu…");
    expect(photo()).toHaveAttribute("src", `${BASE}autre.png`);
  });

  it("aucun nom connu : initiales « ? »", () => {
    render(<PlayerPhotoPreview preview={preview("")} player={{ firstName: "", lastName: "" }} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("la zone d'état est annoncée poliment", () => {
    render(<PlayerPhotoPreview preview={preview("")} player={PLAYER} />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });
});

describe("PlayerPhotoField", () => {
  function renderField(defaultValue = "") {
    render(
      <AdminForm action={async () => IDLE_FORM_STATE} submitLabel="OK" busyLabel="…" cancelHref="/x">
        <input name="firstName" aria-label="Prénom" defaultValue="Paul" />
        <input name="lastName" aria-label="Nom" defaultValue="Durand" />
        <PlayerPhotoField defaultValue={defaultValue} baseUrl={BASE} initialName={{ firstName: "", lastName: "" }} />
      </AdminForm>,
    );
  }

  it("le champ a un libellé ; l'aperçu ne change qu'à la perte de focus", async () => {
    renderField();
    const field = screen.getByRole("textbox", { name: "Photo (nom du fichier)" });
    await userEvent.type(field, "durand.png");
    expect(photo()).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Aucune photo");
    await userEvent.tab();
    expect(photo()).toHaveAttribute("src", `${BASE}durand.png`);
  });

  it("nom invalide à la perte de focus : message sans chargement d'image", async () => {
    renderField();
    await userEvent.type(screen.getByRole("textbox", { name: "Photo (nom du fichier)" }), "x.svg");
    await userEvent.tab();
    expect(screen.getByRole("status")).toHaveTextContent("Nom de fichier non valide");
    expect(photo()).toBeNull();
  });

  it("valeur initiale : aperçu dès l'affichage ; vider le champ revient aux initiales lues dans le formulaire", async () => {
    renderField("durand.png");
    expect(photo()).toHaveAttribute("src", `${BASE}durand.png`);
    const field = screen.getByRole("textbox", { name: "Photo (nom du fichier)" });
    await userEvent.clear(field);
    await userEvent.tab();
    expect(photo()).toBeNull();
    expect(screen.getByText("PD")).toBeInTheDocument();
  });

  it("l'indice annonce que vider le champ retire la photo", () => {
    renderField();
    expect(screen.getByRole("textbox", { name: "Photo (nom du fichier)" })).toHaveAccessibleDescription(
      /vider le champ retire la photo actuelle/,
    );
  });
});
