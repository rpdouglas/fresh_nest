import { Component, type ReactNode } from 'react'
import { isCodeLoadError } from '../lib/clientError'

interface Props {
  /** Asks for the report's data again. */
  onRetry?: () => void
  /**
   * Changes when fresh data has arrived (the time it was loaded). The report is drawn again
   * then, not before: drawing it at once would only fail again on the data that broke it.
   * Leave it out for a report that loads its own data; Try again then draws it afresh at once.
   */
  dataKey?: number
  /** Around the whole site, as the last resort: the menu is gone with it, so the way out is to reload. */
  wholePage?: boolean
  /** For a small extra (the filter bar, the menu's totals): draw nothing in its place, no message. */
  quiet?: boolean
  children: ReactNode
}

/** A fault while drawing, or the report's code could not be fetched (see lazyReports.ts). */
type Failed = false | 'fault' | 'code'

/**
 * Around the report: a fault while one is drawing shows a message in its place, and the
 * header and the tab bar keep working. Give it `key={view}` so that opening another
 * report starts clean. main.tsx puts a second one around the whole site for a fault outside a
 * report. The fault is reported from main.tsx, not from here.
 */
export default class ErrorBoundary extends Component<Props, { failed: Failed; dataKey: number | undefined }> {
  state = { failed: false as Failed, dataKey: this.props.dataKey }

  static getDerivedStateFromError(error: unknown) {
    return { failed: isCodeLoadError(error) ? 'code' : 'fault' }
  }

  /** Fresh data has arrived: draw the report again. */
  static getDerivedStateFromProps(props: Props, state: { dataKey: number | undefined }) {
    return props.dataKey === state.dataKey ? null : { failed: false, dataKey: props.dataKey }
  }

  render() {
    const { failed } = this.state
    if (!failed) return this.props.children
    if (this.props.quiet) return null
    // code that could not be fetched stays unfetched until the page is loaded again
    const reload = failed === 'code' || this.props.wholePage
    return (
      <div
        role="alert"
        className={`${this.props.wholePage ? 'm-4' : 'mb-4'} rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200`}
      >
        <p className="font-semibold">
          {failed === 'code'
            ? 'This report could not be loaded.'
            : this.props.wholePage
              ? 'The page could not be shown.'
              : 'This report could not be shown.'}
        </p>
        <p className="mt-1">
          {reload ? 'Reload the page to try again.' : 'The problem has been reported. Try again, or choose another report from the menu.'}
        </p>
        <button
          className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold dark:border-red-800"
          onClick={() => {
            if (reload) return window.location.reload()
            if (this.props.dataKey === undefined) this.setState({ failed: false })
            this.props.onRetry?.()
          }}
        >
          {reload ? 'Reload' : 'Try again'}
        </button>
      </div>
    )
  }
}
