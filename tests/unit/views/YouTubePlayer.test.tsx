// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { YouTubePlayer } from "@/views/game-detail/components/YouTubePlayer";

const TITLE = "Vidéo du match FAC Basket contre OTB, journée 9";

describe("YouTubePlayer", () => {
  it("ne charge rien de YouTube avant le clic", () => {
    const { container } = render(<YouTubePlayer videoId="t8QR6Oq4i5s" title={TITLE} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /Regarder sur YouTube/ })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=t8QR6Oq4i5s",
    );
  });

  it("charge le lecteur sans cookie au clic, avec un titre explicite", async () => {
    render(<YouTubePlayer videoId="t8QR6Oq4i5s" title={TITLE} />);
    await userEvent.click(screen.getByRole("button", { name: "Lire la vidéo" }));
    const frame = screen.getByTitle(TITLE);
    expect(frame.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/t8QR6Oq4i5s?autoplay=1&rel=0");
    expect(frame).toHaveFocus();
  });
});
