// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPagination } from "@/components/admin/AdminPagination";

const buildHref = (page: number) => `/admin/logs?page=${page}`;
const unit = { singular: "erreur", plural: "erreurs" };

describe("AdminPagination", () => {
  it("masquée à une seule page", () => {
    const { container } = render(
      <AdminPagination page={{ page: 1, pageCount: 1, total: 12 }} buildHref={buildHref} unit={unit} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("page du milieu : deux liens, texte central", () => {
    render(<AdminPagination page={{ page: 2, pageCount: 7, total: 134 }} buildHref={buildHref} unit={unit} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute("href", "/admin/logs?page=1");
    expect(screen.getByRole("link", { name: "Suivant" })).toHaveAttribute("href", "/admin/logs?page=3");
    expect(screen.getByText("Page 2 sur 7 (134 erreurs)")).toBeInTheDocument();
  });

  it("première page : « Précédent » absent (pas de lien mort)", () => {
    render(<AdminPagination page={{ page: 1, pageCount: 3, total: 120 }} buildHref={buildHref} unit={unit} />);
    expect(screen.queryByRole("link", { name: "Précédent" })).toBeNull();
    expect(screen.getByRole("link", { name: "Suivant" })).toBeInTheDocument();
  });

  it("dernière page : « Suivant » absent ; singulier pour un élément", () => {
    render(<AdminPagination page={{ page: 3, pageCount: 3, total: 1 }} buildHref={buildHref} unit={unit} />);
    expect(screen.queryByRole("link", { name: "Suivant" })).toBeNull();
    expect(screen.getByText("Page 3 sur 3 (1 erreur)")).toBeInTheDocument();
  });
});
