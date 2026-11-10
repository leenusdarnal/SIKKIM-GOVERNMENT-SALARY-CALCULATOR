import adapterStatic from '@sveltejs/adapter-static';
import adapterVercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const adapter = isGitHubPages
  ? adapterStatic({ fallback: '404.html', strict: true })
  : adapterVercel({ runtime: 'nodejs24.x' });

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({ adapter })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
