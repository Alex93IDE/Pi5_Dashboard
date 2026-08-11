import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'

/**
 * Identifies the build so you can answer "do I have the latest?" from the app.
 *
 * It's the git hash, not a hand-bumped number: that way it never depends on
 * anyone remembering to raise it. The trailing `+` warns the build was made
 * with uncommitted changes — exactly when the hash lies about what's inside.
 */
function buildVersion(): string {
  const git = (cmd: string) =>
    execSync(cmd, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  try {
    return git('git rev-parse --short HEAD') + (git('git status --porcelain -- .') === '' ? '' : '+')
  } catch {
    // Without git (or a repo) the app still builds: the version is something to
    // look at, not something anything depends on.
    return 'no-git'
  }
}

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
    __APP_VERSION__: JSON.stringify(buildVersion()),
    __BUILD_DATE__: JSON.stringify(buildDate()),
  },
})
