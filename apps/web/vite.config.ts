import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEFAULT_NOOR_RUNTIME_DEV_ORIGIN =
  "http://127.0.0.1:8787";

function readNoorRuntimeDevOrigin() {
  const configured =
    process.env.NOOR_RUNTIME_DEV_ORIGIN
    ?? DEFAULT_NOOR_RUNTIME_DEV_ORIGIN;

  const url =
    new URL(
      configured,
    );

  if (
    (
      url.protocol !== "http:"
      && url.protocol !== "https:"
    )
    || url.username.length > 0
    || url.password.length > 0
    || url.pathname !== "/"
    || url.search.length > 0
    || url.hash.length > 0
  ) {
    throw new Error(
      "NOOR_RUNTIME_DEV_ORIGIN must be an HTTP(S) origin.",
    );
  }

  return url.origin;
}

export default defineConfig({
  plugins: [
    react(),
  ],

  server: {
    proxy: {
      "/api/noor": {
        target:
          readNoorRuntimeDevOrigin(),
        changeOrigin:
          false,
      },
    },
  },
});
