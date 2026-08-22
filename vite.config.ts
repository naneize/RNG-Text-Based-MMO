import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  // singlefile: ฝัง JS/CSS ลง index.html ทั้งหมด (ไฟล์เดียวจบ)
  // จำเป็นสำหรับ itch.io — CDN ของ itch ตอบ MIME text/html กับ module script ทำให้เกม Vite จอขาว
  plugins: [react(), viteSingleFile()],
  base: './', // <--- เติมบรรทัดนี้ลงไปเพื่อให้มันหาไฟล์เจอ
  build: {
    // กัน chunk แยก (worker เก็บไว้ก็ได้เพราะไม่ใช่ module หลักของหน้า)
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})