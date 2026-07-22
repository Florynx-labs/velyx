import { defineConfig } from 'vite';
import velyxPlugin from '@velyx/adapter-vite';

export default defineConfig({
  plugins: [velyxPlugin()]
});
