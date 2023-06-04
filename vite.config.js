/* global process */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const { DEV_SERVER_PORT, SERVER_PORT } = env;
  return {
    plugins: [react()],
    server: {
      cors: true,
      port: DEV_SERVER_PORT ?? 3000,
      proxy: {
        "/api": {
          target: `http://localhost:${SERVER_PORT ?? 4000}/`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        // input: "src/main.jsx",
        output: {
          entryFileNames: "assets/chatbot.js",
          chunkFileNames: "assets/chatbot.js",
          assetFileNames: "assets/chatbot.css",
        },
      },
    },
  };
});
