import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig(async () => {
  const plugins = [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ];

  // Only load Miaoda plugin in development — it forces rolldown-vite which breaks CSS minification
  if (isDev) {
    const { miaodaDevPlugin } = await import("miaoda-sc-plugin");
    plugins.unshift(miaodaDevPlugin());
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      cssMinify: false, // rolldown-vite overrides esbuild setting, disable entirely for production
    },
  };
});