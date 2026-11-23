import { describe, expect, it } from 'vitest'
import { ApiError } from '../api'
import { type ErrorReport, createReporter } from './clientError'

function setup() {
  const sent: { report: ErrorReport; token: string }[] = []
  const r = createReporter((report, token) => sent.push({ report, token }))
  return { r, sent }
}
const fault = (message: string, where = 'at Report (index-abc.js:1:2)') => Object.assign(new TypeError(message), { stack: `TypeError: ${message}\n    ${where}` })

describe('reporting a fault in the site', () => {
  it('sends nothing while nobody is signed in', () => {
    const { r, sent } = setup()
    r.report(fault('x is undefined'), { source: 'render' })
    r.setContext(null, 'payroll')
    r.report(fault('x is undefined'), { source: 'render' })
    expect(sent).toEqual([])
  })

  it('sends the error, its stacks and the report that was open, with the sign-in', () => {
    const { r, sent } = setup()
    r.setContext('tok', 'payroll')
    r.report(fault('x is undefined'), { source: 'render', componentStack: 'at PayrollView' })
    expect(sent).toEqual([
      {
        token: 'tok',
        report: { message: 'TypeError: x is undefined', stack: 'TypeError: x is undefined\n    at Report (index-abc.js:1:2)', componentStack: 'at PayrollView', view: 'payroll', source: 'render' },
      },
    ])
  })

  it('sends the same fault once, and a different one again', () => {
    const { r, sent } = setup()
    r.setContext('tok', 'teams')
    r.report(fault('a'), { source: 'render' })
    r.report(fault('a'), { source: 'window' })
    r.report(fault('a', 'at Other (index-abc.js:9:9)'), { source: 'render' })
    r.report(fault('b'), { source: 'render' })
    expect(sent.map((s) => s.report.message)).toEqual(['TypeError: a', 'TypeError: a', 'TypeError: b'])
  })

  it('stops after five from one page load', () => {
    const { r, sent } = setup()
    r.setContext('tok', 'teams')
    for (let i = 0; i < 20; i++) r.report(fault(`fault ${i}`), { source: 'promise' })
    expect(sent).toHaveLength(5)
  })

  it('leaves out what is not a fault here: a cancelled or refused request, another site\'s script', () => {
    const { r, sent } = setup()
    r.setContext('tok', 'teams')
    r.report(new ApiError(0, 'Could not reach the server. Check your connection.'), { source: 'promise' })
    r.report(new ApiError(401, 'Sign in'), { source: 'promise' })
    r.report(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }), { source: 'promise' })
    r.report('Script error.', { source: 'window' })
    // a report's code that could not be fetched, as Chrome, Firefox and Safari word it
    r.report(new TypeError('Failed to fetch dynamically imported module: https://x/assets/PayrollView-abc.js'), { source: 'render' })
    r.report(new TypeError('error loading dynamically imported module'), { source: 'render' })
    r.report(new TypeError('Importing a module script failed.'), { source: 'render' })
    expect(sent).toEqual([])
    r.report('something odd', { source: 'promise' })
    expect(sent[0].report).toMatchObject({ message: 'something odd', stack: null })
  })

  it('cuts a long message and long stacks to what the server keeps', () => {
    const { r, sent } = setup()
    r.setContext('tok', 'teams')
    r.report(Object.assign(new Error('m'.repeat(9000)), { stack: 's'.repeat(9000) }), { source: 'render', componentStack: 'c'.repeat(9000) })
    const { message, stack, componentStack } = sent[0].report
    expect([message.length, stack?.length, componentStack?.length]).toEqual([500, 4000, 4000])
  })

  it('never throws, even when sending does', () => {
    const r = createReporter(() => {
      throw new Error('no network')
    })
    r.setContext('tok', 'teams')
    expect(() => r.report(fault('a'), { source: 'render' })).not.toThrow()
  })
})
