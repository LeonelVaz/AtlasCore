import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // <-- Añade ({ command }) aquí
  const config = {
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "@core": resolve(__dirname, "src/core"),
        "@components": resolve(__dirname, "src/components"),
        "@styles": resolve(__dirname, "src/styles"),
      },
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    // Configuración de 'base'
    base: command === "serve" ? "/" : "./", // <-- ¡ESTA ES LA LÍNEA CLAVE!
  };
  return config;
});
