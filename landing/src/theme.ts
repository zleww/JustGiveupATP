// The Arena's colours for the parts that take them as props (WebGL, canvas, SVG).
// Keep in step with theme.css.
import "@fontsource-variable/cinzel";
import "@fontsource-variable/dm-sans";

export const theme = {
  accent: "#C89B53",
  onAccent: "#060D14",
  aurora: ["#1A3552", "#C89B53", "#6EA8E0"],
  gradient: ["#E3B467", "#F5F1E8", "#E3B467"],
  shiny: "#C9CDD3",
  shine: "#FFFFFF",
  star: { color: "#F5F1E8", trail: "#6EA8E0" },
  wire: ["#6EA8E0", "#E3B467"] as [string, string],
  spotlight: "rgba(200, 155, 83, 0.14)",
};
