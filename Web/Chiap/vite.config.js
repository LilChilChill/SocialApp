import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL) || '""',
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),  // Trang chính
        home: path.resolve(__dirname, 'components/home.html'),  // Trang home
        profile: path.resolve(__dirname, 'components/profile.html'),  // Trang profile
        message: path.resolve(__dirname, 'components/message.html'),  // Trang message
      }
    }
  }
});
