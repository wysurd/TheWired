import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react(), tailwindcss()],
  base:
    process.env.VITE_BASE_PATH ||
    (process.env.GITHUB_ACTIONS && (command === "build" || isPreview)
      ? "/TheWired/"
      : "/"),
}));
