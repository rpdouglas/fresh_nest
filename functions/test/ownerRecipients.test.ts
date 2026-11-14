import { describe, it, expect } from 'vitest'
import { parseRecipients } from '../src/sendEmail'

// Quote alerts can go to several office inboxes via a comma-separated OWNER_EMAIL secret.
describe('parseRecipients', () => {
  it('keeps a single address working', () => {
    expect(parseRecipients('quotes@freshnestco.ca')).toEqual(['quotes@freshnestco.ca'])
  })

  it('splits comma- and semicolon-separated addresses and trims spaces', () => {
    expect(parseRecipients(' hr.freshnest@gmail.com, freshnestcompany2023@gmail.com ;x@y.ca ')).toEqual([
      'hr.freshnest@gmail.com',
      'freshnestcompany2023@gmail.com',
      'x@y.ca',
    ])
  })

  it('drops empty entries', () => {
    expect(parseRecipients('a@b.ca,, ,')).toEqual(['a@b.ca'])
    expect(parseRecipients('')).toEqual([])
  })
})
