/** @type {import('@ladle/react').Config} */
export default {
  // Use the repo's Vite config for Tailwind/Aura theme compatibility.
  // Ladle reads vite.config.ts automatically; no extra wiring needed.
  stories: "src/components/**/*.stories.tsx",
  // Base path — repo root on GitHub Pages? Ladle is dev-only, so default.
  base: "/ladle/",
};
