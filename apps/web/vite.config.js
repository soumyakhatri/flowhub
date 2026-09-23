import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
var stdin_default = defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
});
export {
  stdin_default as default
};
