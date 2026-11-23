// Who has signed in decides what is loaded at all (decision 0037). Someone from the office gets the
// site as it was. A cleaner gets My week and nothing else: App, with its reports and the requests they
// make, is never rendered for them, so no report asks the server for anything and no report's own code
// is fetched. (App's frame is in the first script everyone downloads before signing in; it holds no data.)
import { Suspense, useCallback } from 'react'
import App from './App'
import SignInGate from './components/SignInGate'
import Spinner from './components/Spinner'
import { useEditor } from './components/useEditor'
import { MyWeekView } from './lazyReports'
import { forgetLoaded } from './lib/queries'

export default function Root() {
  const session = useEditor()
  const { editor, note, signIn, expire, signOut } = session
  const leave = useCallback(() => {
    signOut()
    forgetLoaded()
  }, [signOut])

  if (!editor) return <SignInGate note={note} onSignedIn={signIn} />
  if (editor.role === 'cleaner') {
    return (
      <Suspense
        fallback={
          <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-4 text-ink-muted">
            <Spinner className="size-10 text-accent dark:text-accent-dark" />
            <p>Loading your week…</p>
          </div>
        }
      >
        <MyWeekView editor={editor} onExpired={expire} onSignOut={leave} />
      </Suspense>
    )
  }
  return <App session={session} />
}
