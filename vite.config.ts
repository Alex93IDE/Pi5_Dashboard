import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * When it was built, as a single number: 202608101157.
 *
 * No dashes or colons because it isn't a date to read but a marker to compare
 * at a glance against the phone's or the server's: it reads in one go and sorts
 * itself.
 */
function buildDate(): string {
  const d = new Date()
  const dd = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${dd(d.getMonth() + 1)}${dd(d.getDate())}${dd(d.getHours())}${dd(d.getMinutes())}`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate()),
  },
})
