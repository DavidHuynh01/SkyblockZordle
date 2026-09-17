/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mc: ['"Press Start 2P"', "monospace"],
      },
      colors: {
        // Minecraft / Hypixel rarity palette
        rarity: {
          common: "#ffffff",
          uncommon: "#55ff55",
          rare: "#5555ff",
          epic: "#aa00aa",
          legendary: "#ffaa00",
          mythic: "#ff55ff",
          divine: "#55ffff",
          special: "#ff5555",
        },
        panel: "#c6c6c6",
        paneldark: "#373737",
        dirt: "#866043",
        grass: "#7cb342",
      },
      keyframes: {
        flip: {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        flip: "flip 0.5s ease",
        pop: "pop 0.2s ease",
      },
    },
  },
  plugins: [],
};
