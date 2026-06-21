import { Component, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

function ErrorFallback() {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-warm-white flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-body text-base text-charcoal">{t('common.chunkError')}</p>
      <button
        className="min-h-[48px] px-6 bg-slate-brand text-white font-body text-base rounded"
        onClick={() => window.location.reload()}
      >
        {t('common.refresh')}
      </button>
    </div>
  )
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) return <ErrorFallback />
    return this.props.children
  }
}
