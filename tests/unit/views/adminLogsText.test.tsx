// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LogContextViewer } from "@/views/admin-logs/components/LogContextViewer";
import { LogText } from "@/views/admin-logs/components/LogText";
import { LogTimestamp } from "@/views/admin-logs/components/LogTimestamp";

describe("LogText", () => {
  it("un <script> s'affiche en texte : aucun élément créé, aucun lien", () => {
    const { container } = render(
      <LogText text={'<script>alert(1)</script> <a href="https://x.invalid">go</a> <img src=x onerror=alert(1)>'} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent('<script>alert(1)</script> <a href="https://x.invalid">go</a>');
  });

  it("U+202E et caractères de contrôle neutralisés", () => {
    const { container } = render(<LogText text={"a‮b\u0007c"} />);
    expect(container.textContent).toBe("a�b�c");
  });

  it("troncature en liste : « … » ajouté", () => {
    const { container } = render(<LogText text={"x".repeat(130)} maxChars={120} />);
    expect(container.textContent).toBe(`${"x".repeat(120)}…`);
  });

  it("détail : zone focalisable, retours à la ligne conservés, mention de troncature", () => {
    const { container } = render(<LogText text={`a\nb${"x".repeat(30)}`} maxChars={10} multiline />);
    const zone = container.querySelector("[tabindex='0']");
    expect(zone?.textContent).toBe("a\nbxxxxxxx");
    expect(screen.getByText(/Texte tronqué : 10 caractères affichés sur 33\./)).toBeInTheDocument();
  });

  it("détail non tronqué : aucune mention", () => {
    render(<LogText text="court" maxChars={100} multiline />);
    expect(screen.queryByText(/Texte tronqué/)).toBeNull();
  });
});

describe("LogContextViewer", () => {
  it("JSON indenté dans un <pre> focalisable nommé", () => {
    render(<LogContextViewer context={{ a: 1, html: "<b>x</b>" }} />);
    const pre = screen.getByLabelText("Contexte (JSON)");
    expect(pre.tagName).toBe("PRE");
    expect(pre).toHaveAttribute("tabindex", "0");
    expect(pre.textContent).toContain('"a": 1');
    expect(pre.querySelector("b")).toBeNull();
  });

  it("aucun contexte", () => {
    render(<LogContextViewer context={null} />);
    expect(screen.getByText("Aucun contexte")).toBeInTheDocument();
  });

  it("contexte trop long : mention de troncature", () => {
    render(<LogContextViewer context={{ big: "x".repeat(25_000) }} />);
    expect(screen.getByText(/Texte tronqué/)).toBeInTheDocument();
  });
});

describe("LogTimestamp", () => {
  it("heure de Paris, jour et heure séparés, <time dateTime> en UTC", () => {
    const { container } = render(<LogTimestamp isoUtc="2026-10-12T12:02:11.000000Z" />);
    const time = container.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-10-12T12:02:11.000000Z");
    expect(time).toHaveTextContent("12/10/2026");
    expect(time).toHaveTextContent("14:02:11");
    expect(time).toHaveTextContent("(heure de paris)");
  });

  it("avec l'UTC : précision sous la date", () => {
    render(<LogTimestamp isoUtc="2026-10-12T12:02:11Z" showUtc />);
    expect(screen.getByText("12/10/2026 14:02:11")).toBeInTheDocument();
    expect(screen.getByText(/Heure de Paris · UTC : 12\/10\/2026 12:02:11/)).toBeInTheDocument();
  });

  it("date invalide : « — »", () => {
    render(<LogTimestamp isoUtc="nope" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
