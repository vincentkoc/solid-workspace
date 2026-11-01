import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
export default defineConfig({ plugins: [solid()], build: { lib: { entry: {index:'src/index.ts', model:'src/model.ts'}, formats:['es'] }, rollupOptions:{ external: id => id === 'solid-js' || id.startsWith('@solidjs/') } } });
