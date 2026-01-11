import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%, 100%": {
            transform: "translateY(0px) translateX(0px)",
          },
          "33%": {
            transform: "translateY(-30px) translateX(20px)",
          },
          "66%": {
            transform: "translateY(15px) translateX(-15px)",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "0.3",
          },
          "50%": {
            opacity: "0.5",
          },
        },
      },
      animation: {
        "float-slow": "float 15s ease-in-out infinite",
        "float-medium": "float 12s ease-in-out infinite 2s",
        "float-slower": "float 18s ease-in-out infinite 4s",
        "float-fast": "float 10s ease-in-out infinite 1s",
        "pulse-glow-slow": "pulse-glow 8s ease-in-out infinite",
        "pulse-glow-medium": "pulse-glow 6s ease-in-out infinite 1s",
        "pulse-glow-slower": "pulse-glow 10s ease-in-out infinite 3s",
        "pulse-glow-fast": "pulse-glow 5s ease-in-out infinite 2s",
      },
    },
  },
  plugins: [],
};

export default config; 