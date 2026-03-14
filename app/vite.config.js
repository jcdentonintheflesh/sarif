import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT || 3001;
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/seats': {
          target: 'https://seats.aero',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/seats/, '/partnerapi'),
          headers: {
            'Partner-Authorization': env.SEATS_API_KEY,
          },
        },
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  };
});
