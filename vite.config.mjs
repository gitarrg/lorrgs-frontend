import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({

    plugins: [
        react(),
    ],

    server: {
        port: 9001,
    }
}));
