// E2E harnesses (F5, P3-E33): a Vite plugin that serves the real app with its Firebase setup module
// replaced by an emulator-connected one. Matches every import that resolves to the real module —
// `@/lib/firebase/firebase`, `./firebase` or `../lib/firebase/firebase` — so app code is untouched.
import type { Plugin } from 'vite'

const stripExt = (id: string) => id.replace(/\?.*$/, '').replace(/\.tsx?$/, '')

export function swapFirebase(realModule: string, harnessModule: string): Plugin {
  const real = stripExt(realModule)
  return {
    name: 'e2e-swap-firebase',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || stripExt(importer) === stripExt(harnessModule)) return null
      if (!/firebase$/.test(stripExt(source))) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      return resolved && stripExt(resolved.id) === real ? harnessModule : null
    },
  }
}
