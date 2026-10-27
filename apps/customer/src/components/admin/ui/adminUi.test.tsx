import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AdminDialog } from './AdminDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { AdminSectionNav } from '../AdminSectionNav'
import { ADMIN_TABS, parseAdminTab } from '../adminTabs'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: unknown) => (typeof fallback === 'string' ? fallback : key) }),
}))

// P3-E33 (P12 Lauren): admin dialogs and section navigation.
function DialogHarness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    onClose()
    setOpen(false)
  }
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <AdminDialog open={open} onClose={close} labelledBy="t" overlayClassName="overlay" panelClassName="panel">
        <h2 id="t">Title</h2>
        <input aria-label="First field" />
        <button>Save</button>
      </AdminDialog>
    </>
  )
}

describe('AdminDialog', () => {
  it('Escape closes it and focus returns to the button that opened it', async () => {
    const onClose = vi.fn()
    render(<DialogHarness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await userEvent.click(opener)
    expect(screen.getByRole('dialog', { name: 'Title' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('moves focus inside, keeps Tab inside, and locks page scroll while open', async () => {
    render(<DialogHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(document.body.style.overflow).toBe('hidden')
    // First focusable is the phone ✕ (hidden by CSS at md+, which jsdom doesn't apply).
    expect(screen.getByRole('button', { name: 'admin.dialog.close' })).toHaveFocus()
    screen.getByRole('button', { name: 'Save' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'admin.dialog.close' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps the classes it was given and only appends phone (max-md:) classes', async () => {
    render(<DialogHarness />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    const panel = screen.getByRole('dialog')
    expect(panel.className.startsWith('panel ')).toBe(true)
    expect(panel.className.replace('panel', '').trim().split(/\s+/).every((c) => c.startsWith('max-md:'))).toBe(true)
  })
})

describe('ConfirmDialog', () => {
  it('names the action and only acts on the confirm button', async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <ConfirmDialog open title="Cancel this booking?" body="This cancels Diane Lafleur's booking." confirmLabel="Cancel booking"
        cancelLabel="Keep booking" onConfirm={onConfirm} onCancel={onCancel} tone="danger" />,
    )
    expect(screen.getByRole('dialog', { name: 'Cancel this booking?' })).toHaveTextContent('Diane Lafleur')
    // The safe choice gets focus first.
    expect(screen.getByRole('button', { name: 'Keep booking' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Keep booking' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel booking' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})

describe('AdminSectionNav', () => {
  it('offers every section in the phone select and reports the chosen key', async () => {
    const onChange = vi.fn()
    render(<AdminSectionNav active="bookings" onChange={onChange} />)
    const select = screen.getByLabelText('admin.nav.section')
    // P3-E35: Team & roles is Owner-only.
    expect(Array.from((select as HTMLSelectElement).options).map((o) => o.value)).toEqual(ADMIN_TABS.filter((tab) => tab.key !== 'team').map((tab) => tab.key))
    await userEvent.selectOptions(select, 'reviews')
    expect(onChange).toHaveBeenCalledWith('reviews')
  })

  it('Owners also get the Team & roles section', () => {
    render(<AdminSectionNav active="bookings" onChange={vi.fn()} isOwner />)
    const select = screen.getByLabelText('admin.nav.section') as HTMLSelectElement
    expect(Array.from(select.options).map((o) => o.value)).toEqual(ADMIN_TABS.map((tab) => tab.key))
  })

  it('keeps the desktop tab strip with one button per section', async () => {
    const onChange = vi.fn()
    render(<AdminSectionNav active="dispatch" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Audit Logs' }))
    expect(onChange).toHaveBeenCalledWith('auditLogs')
    expect(screen.getByRole('button', { name: 'Dispatch Board' }).className).toContain('border-slate-brand')
  })

  it('falls back to Bookings for a missing or unknown ?tab=', () => {
    expect(parseAdminTab(null)).toBe('bookings')
    expect(parseAdminTab('nope')).toBe('bookings')
    expect(parseAdminTab('gallery')).toBe('gallery')
  })
})
