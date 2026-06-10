import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base is set to './' so the production build also works when served from a
// GitHub Pages subpath (e.g. https://user.github.io/watchworthy/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
