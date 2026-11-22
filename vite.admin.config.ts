/**
 * The admin stats page (/admin → admin.html, src/admin/**) is built in its own pass, after the app:
 *   vite build && vite build -c vite.admin.config.ts
 * A second entry in the app's config would make Rollup split React and the tokens into chunks shared by both
 * entries, changing the app's boot requests. Built apart, the app's bundle is untouched and the admin page
 * carries its own copy of React and supabase-js (which the app never loads).
 * Dev: the app's dev server already serves /admin.html (add ?mock=1 for the fixture).
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { blockerNames } from './scripts/blockerNames.ts'

export default defineConfig({
  plugins: [react(), blockerNames()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  publicDir: false,
  build: {
    target: 'es2022',
    sourcemap: false, // nothing of the admin page's source is published
    emptyOutDir: false, // dist/ already holds the app
    rolldownOptions: {
      input: { admin: fileURLToPath(new URL('./admin.html', import.meta.url)) },
      output: {
        entryFileNames: 'assets/admin-[hash].js',
        chunkFileNames: 'assets/admin-[name]-[hash].js',
        assetFileNames: 'assets/admin-[name]-[hash][extname]',
      },
    },
  },
})
