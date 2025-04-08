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
        main: path.resolve(__dirname, 'index.html'),
        home: path.resolve(__dirname, 'components/home.html'),
        profile: path.resolve(__dirname, 'components/profile.html'),
        message: path.resolve(__dirname, 'components/message.html'),
        user: path.resolve(__dirname, 'components/user.html'),
        friendNoti: path.resolve(__dirname, 'components/friendNoti.html'),
        resetPassword: path.resolve(__dirname, 'components/resetPassword.html'),
        forgotPassword: path.resolve(__dirname, 'components/forgotPassword.html'),
        userSettings: path.resolve(__dirname, 'components/userSettings.html'),
        notification: path.resolve(__dirname, 'components/notification.html'),
      }
    }
  }
});
