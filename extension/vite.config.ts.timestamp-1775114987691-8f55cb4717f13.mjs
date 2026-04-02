// vite.config.ts
import { defineConfig } from "file:///C:/laragon/www/jobhunt/extension/node_modules/vite/dist/node/index.js";
import react from "file:///C:/laragon/www/jobhunt/extension/node_modules/@vitejs/plugin-react/dist/index.js";
import { crx } from "file:///C:/laragon/www/jobhunt/extension/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "JobHunt \u2014 AI Job Tracker",
  description: "Your Cognitive Concierge for LinkedIn. AI-powered skill matching, gap analysis, and job tracking.",
  version: "1.0.0",
  icons: {
    "16": "public/icons/icon-16.png",
    "48": "public/icons/icon-48.png",
    "128": "public/icons/icon-128.png"
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "JobHunt"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["https://www.linkedin.com/jobs/*"],
      js: ["src/content/index.tsx"],
      run_at: "document_idle"
    }
  ],
  permissions: [
    "storage",
    "notifications",
    "activeTab",
    "identity"
  ],
  host_permissions: [
    "https://www.linkedin.com/*",
    "http://localhost:8000/*"
  ],
  oauth2: {
    client_id: "421377126660-mcqmrhkminabrh8o3lmdm6dp1cgenrr1.apps.googleusercontent.com",
    scopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  },
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  },
  web_accessible_resources: [
    {
      resources: ["src/content/content.css"],
      matches: ["https://www.linkedin.com/*"]
    }
  ]
};

// vite.config.ts
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
var __vite_injected_original_import_meta_url = "file:///C:/laragon/www/jobhunt/extension/vite.config.ts";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    crx({ manifest: manifest_default })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV === "development",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html")
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAibWFuaWZlc3QuanNvbiJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXGxhcmFnb25cXFxcd3d3XFxcXGpvYmh1bnRcXFxcZXh0ZW5zaW9uXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxqb2JodW50XFxcXGV4dGVuc2lvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovbGFyYWdvbi93d3cvam9iaHVudC9leHRlbnNpb24vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHsgY3J4IH0gZnJvbSBcIkBjcnhqcy92aXRlLXBsdWdpblwiO1xuaW1wb3J0IG1hbmlmZXN0IGZyb20gXCIuL21hbmlmZXN0Lmpzb25cIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwicGF0aFwiO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgX19kaXJuYW1lID0gZGlybmFtZShfX2ZpbGVuYW1lKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgY3J4KHsgbWFuaWZlc3QgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgc291cmNlbWFwOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIHBvcHVwOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvcG9wdXAvaW5kZXguaHRtbFwiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICAgIGhtcjoge1xuICAgICAgcG9ydDogNTE3MyxcbiAgICB9LFxuICB9LFxufSk7XG4iLCAie1xuICBcIm1hbmlmZXN0X3ZlcnNpb25cIjogMyxcbiAgXCJuYW1lXCI6IFwiSm9iSHVudCBcdTIwMTQgQUkgSm9iIFRyYWNrZXJcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIllvdXIgQ29nbml0aXZlIENvbmNpZXJnZSBmb3IgTGlua2VkSW4uIEFJLXBvd2VyZWQgc2tpbGwgbWF0Y2hpbmcsIGdhcCBhbmFseXNpcywgYW5kIGpvYiB0cmFja2luZy5cIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMS4wLjBcIixcbiAgXCJpY29uc1wiOiB7XG4gICAgXCIxNlwiOiBcInB1YmxpYy9pY29ucy9pY29uLTE2LnBuZ1wiLFxuICAgIFwiNDhcIjogXCJwdWJsaWMvaWNvbnMvaWNvbi00OC5wbmdcIixcbiAgICBcIjEyOFwiOiBcInB1YmxpYy9pY29ucy9pY29uLTEyOC5wbmdcIlxuICB9LFxuICBcImFjdGlvblwiOiB7XG4gICAgXCJkZWZhdWx0X3BvcHVwXCI6IFwic3JjL3BvcHVwL2luZGV4Lmh0bWxcIixcbiAgICBcImRlZmF1bHRfdGl0bGVcIjogXCJKb2JIdW50XCJcbiAgfSxcbiAgXCJiYWNrZ3JvdW5kXCI6IHtcbiAgICBcInNlcnZpY2Vfd29ya2VyXCI6IFwic3JjL2JhY2tncm91bmQvaW5kZXgudHNcIixcbiAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxuICB9LFxuICBcImNvbnRlbnRfc2NyaXB0c1wiOiBbXG4gICAge1xuICAgICAgXCJtYXRjaGVzXCI6IFtcImh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9qb2JzLypcIl0sXG4gICAgICBcImpzXCI6IFtcInNyYy9jb250ZW50L2luZGV4LnRzeFwiXSxcbiAgICAgIFwicnVuX2F0XCI6IFwiZG9jdW1lbnRfaWRsZVwiXG4gICAgfVxuICBdLFxuICBcInBlcm1pc3Npb25zXCI6IFtcbiAgICBcInN0b3JhZ2VcIixcbiAgICBcIm5vdGlmaWNhdGlvbnNcIixcbiAgICBcImFjdGl2ZVRhYlwiLFxuICAgIFwiaWRlbnRpdHlcIlxuICBdLFxuICBcImhvc3RfcGVybWlzc2lvbnNcIjogW1xuICAgIFwiaHR0cHM6Ly93d3cubGlua2VkaW4uY29tLypcIixcbiAgICBcImh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC8qXCJcbiAgXSxcbiAgXCJvYXV0aDJcIjoge1xuICAgIFwiY2xpZW50X2lkXCI6IFwiNDIxMzc3MTI2NjYwLW1jcW1yaGttaW5hYnJoOG8zbG1kbTZkcDFjZ2VucnIxLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIsXG4gICAgXCJzY29wZXNcIjogW1xuICAgICAgXCJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9hdXRoL3VzZXJpbmZvLmVtYWlsXCIsXG4gICAgICBcImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL2F1dGgvdXNlcmluZm8ucHJvZmlsZVwiXG4gICAgXVxuICB9LFxuICBcImNvbnRlbnRfc2VjdXJpdHlfcG9saWN5XCI6IHtcbiAgICBcImV4dGVuc2lvbl9wYWdlc1wiOiBcInNjcmlwdC1zcmMgJ3NlbGYnOyBvYmplY3Qtc3JjICdzZWxmJ1wiXG4gIH0sXG4gIFwid2ViX2FjY2Vzc2libGVfcmVzb3VyY2VzXCI6IFtcbiAgICB7XG4gICAgICBcInJlc291cmNlc1wiOiBbXCJzcmMvY29udGVudC9jb250ZW50LmNzc1wiXSxcbiAgICAgIFwibWF0Y2hlc1wiOiBbXCJodHRwczovL3d3dy5saW5rZWRpbi5jb20vKlwiXVxuICAgIH1cbiAgXVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0UixTQUFTLG9CQUFvQjtBQUN6VCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxXQUFXOzs7QUNGcEI7QUFBQSxFQUNFLGtCQUFvQjtBQUFBLEVBQ3BCLE1BQVE7QUFBQSxFQUNSLGFBQWU7QUFBQSxFQUNmLFNBQVc7QUFBQSxFQUNYLE9BQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxRQUFVO0FBQUEsSUFDUixlQUFpQjtBQUFBLElBQ2pCLGVBQWlCO0FBQUEsRUFDbkI7QUFBQSxFQUNBLFlBQWM7QUFBQSxJQUNaLGdCQUFrQjtBQUFBLElBQ2xCLE1BQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQjtBQUFBLE1BQ0UsU0FBVyxDQUFDLGlDQUFpQztBQUFBLE1BQzdDLElBQU0sQ0FBQyx1QkFBdUI7QUFBQSxNQUM5QixRQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGFBQWU7QUFBQSxJQUNiO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0Esa0JBQW9CO0FBQUEsSUFDbEI7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBVTtBQUFBLElBQ1IsV0FBYTtBQUFBLElBQ2IsUUFBVTtBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLHlCQUEyQjtBQUFBLElBQ3pCLGlCQUFtQjtBQUFBLEVBQ3JCO0FBQUEsRUFDQSwwQkFBNEI7QUFBQSxJQUMxQjtBQUFBLE1BQ0UsV0FBYSxDQUFDLHlCQUF5QjtBQUFBLE1BQ3ZDLFNBQVcsQ0FBQyw0QkFBNEI7QUFBQSxJQUMxQztBQUFBLEVBQ0Y7QUFDRjs7O0FEL0NBLFNBQVMsZUFBZTtBQUN4QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGVBQWU7QUFOeUosSUFBTSwyQ0FBMkM7QUFRbE8sSUFBTSxhQUFhLGNBQWMsd0NBQWU7QUFDaEQsSUFBTSxZQUFZLFFBQVEsVUFBVTtBQUVwQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixJQUFJLEVBQUUsMkJBQVMsQ0FBQztBQUFBLEVBQ2xCO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsV0FBVyxLQUFLO0FBQUEsSUFDL0I7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQUEsSUFDcEMsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsT0FBTyxRQUFRLFdBQVcsc0JBQXNCO0FBQUEsTUFDbEQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osS0FBSztBQUFBLE1BQ0gsTUFBTTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
