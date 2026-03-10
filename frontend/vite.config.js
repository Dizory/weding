import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Aspire WithReference(server) задаёт SERVER_HTTP/SERVER_HTTPS; без Aspire — порт сервера по умолчанию
const apiTarget = process.env.SERVER_HTTPS || process.env.SERVER_HTTP || 'http://localhost:5405';
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true
            }
        }
    }
});
