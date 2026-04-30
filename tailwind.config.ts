import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./content/**/*.mdx",
    "./packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        terminal: {
          bg: "#0a0e14",
          fg: "#b3b1ad",
          green: "#7fd962",
          amber: "#ffb454",
          blue: "#59c2ff",
          red: "#f07178",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
