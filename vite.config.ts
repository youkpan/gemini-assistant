import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  server: { port: 3000 ,
    https: {
      key: fs.readFileSync('/etc/letsencrypt/live/stylee.top-0001/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/stylee.top-0001/fullchain.pem'),
    }
  },
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
