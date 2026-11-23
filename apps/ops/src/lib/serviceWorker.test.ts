import { describe, expect, it } from 'vitest'
import { ALWAYS_KEPT, serviceWorkerSource, versionOf } from './serviceWorker'

const files = (source: string): string[] => JSON.parse(/const FILES = (.*)/.exec(source)![1])

describe('serviceWorkerSource', () => {
  it("keeps the page, the icons and the build's own files, and nothing else", () => {
    const kept = files(serviceWorkerSource(['assets/index-a1.js', 'assets/index-b2.css', 'index.html', 'sw.js']))
    expect(kept).toEqual([...ALWAYS_KEPT, '/assets/index-a1.js', '/assets/index-b2.css'])
  })

  it('never keeps data: requests under /api/ are left to the network', () => {
    expect(serviceWorkerSource([])).toContain("url.pathname.startsWith('/api/')) return")
  })

  it('has a new version when the build changes, and the same one when it does not', () => {
    const a = serviceWorkerSource(['assets/index-a1.js'])
    expect(serviceWorkerSource(['assets/index-a1.js'])).toBe(a)
    expect(serviceWorkerSource(['assets/index-c3.js'])).not.toBe(a)
    expect(versionOf(['b', 'a'])).toBe(versionOf(['a', 'b']))
  })

  it('is a script that parses', () => {
    expect(() => new Function(serviceWorkerSource(['assets/index-a1.js']))).not.toThrow()
  })
})
