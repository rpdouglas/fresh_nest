/**
 * P3-E40: Bilingual EN/FR email templates for sales pipeline assignment alerts and daily follow-up digests.
 */

const SERVICE_EN: Record<string, string> = {
  standard: 'Standard Cleaning',
  deep: 'Deep Cleaning',
  moveout: 'Move-In / Move-Out Cleaning',
  postconstruction: 'Post-Construction Cleaning',
  airbnb: 'Airbnb Turnover',
  commercial: 'Commercial Cleaning',
}

const SERVICE_FR: Record<string, string> = {
  standard: 'Entretien régulier',
  deep: 'Grand ménage',
  moveout: 'Ménage de déménagement',
  postconstruction: 'Ménage après construction',
  airbnb: 'Rotation Airbnb',
  commercial: 'Entretien commercial',
}

const FREQ_EN: Record<string, string> = {
  'one-time': 'One-Time',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
}

const FREQ_FR: Record<string, string> = {
  'one-time': 'Ponctuel',
  weekly: 'Hebdomadaire',
  biweekly: 'Aux deux semaines',
  monthly: 'Mensuel',
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function detailsTable(rows: Array<[string, string]>): string {
  const rowHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px;color:#5f727c;font-size:14px;width:38%;border-bottom:1px solid #e8ddd0;">${label}</td>
          <td style="padding:10px 14px;color:#2c3a40;font-size:15px;border-bottom:1px solid #e8ddd0;">${value}</td>
        </tr>`,
    )
    .join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ddd0;border-radius:4px;margin-bottom:20px;border-collapse:collapse;">${rowHtml}</table>`
}

export interface LeadAssignedEmailData {
  bookingId: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientLanguage: 'en' | 'fr'
  serviceType: string
  frequency: string
  preferredDate: string
  locationDisplay: string
  needsSiteVisit: boolean
  assignedBy: string | null
  isNewLead: boolean
}

export function leadAssignedSubject(data: LeadAssignedEmailData, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const service = isFr
    ? (SERVICE_FR[data.serviceType] ?? data.serviceType)
    : (SERVICE_EN[data.serviceType] ?? data.serviceType)
  if (data.isNewLead) {
    return isFr
      ? `Nouveau prospect — ${data.clientName} (${service})`
      : `New lead assigned — ${data.clientName} (${service})`
  }
  return isFr
    ? `Prospect assigné — ${data.clientName} (${service})`
    : `Lead assigned to you — ${data.clientName} (${service})`
}

export function leadAssignedHtml(data: LeadAssignedEmailData, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const service = isFr
    ? (SERVICE_FR[data.serviceType] ?? data.serviceType)
    : (SERVICE_EN[data.serviceType] ?? data.serviceType)
  const freq = isFr
    ? (FREQ_FR[data.frequency] ?? data.frequency)
    : (FREQ_EN[data.frequency] ?? data.frequency)
  const targetText = data.needsSiteVisit
    ? (isFr ? 'Objectif premier contact : 1 heure (visite sur place)' : 'First-contact target: 1 hour (in-person quote)')
    : (isFr ? 'Objectif premier contact : 2 heures' : 'First-contact target: 2 hours')
  const heading = data.isNewLead
    ? (isFr ? 'Nouvelle demande de devis assignée' : 'New quote request assigned to you')
    : (isFr ? 'Un prospect vous a été assigné' : 'A lead has been assigned to you')
  const intro =
    data.assignedBy && !data.isNewLead
      ? (isFr
        ? `Assigné par ${esc(data.assignedBy)}. Veuillez communiquer avec le client dans sa langue (${data.clientLanguage.toUpperCase()}).`
        : `Assigned by ${esc(data.assignedBy)}. Please contact the client in their preferred language (${data.clientLanguage.toUpperCase()}).`)
      : (isFr
        ? `Veuillez communiquer avec le client dans sa langue (${data.clientLanguage.toUpperCase()}).`
        : `Please contact the client in their preferred language (${data.clientLanguage.toUpperCase()}).`)

  const table = detailsTable([
    [isFr ? 'Client' : 'Client', esc(data.clientName)],
    [isFr ? 'Téléphone' : 'Phone', esc(data.clientPhone)],
    [isFr ? 'Courriel' : 'Email', esc(data.clientEmail)],
    [isFr ? 'Langue du client' : 'Client language', data.clientLanguage === 'fr' ? 'Français (FR)' : 'English (EN)'],
    [isFr ? 'Service' : 'Service', esc(service)],
    [isFr ? 'Fréquence' : 'Frequency', esc(freq)],
    [isFr ? 'Date préférée' : 'Preferred date', esc(data.preferredDate)],
    [isFr ? 'Lieu' : 'Location', esc(data.locationDisplay)],
    [isFr ? 'Référence' : 'Reference', `#${esc(data.bookingId.slice(0, 8).toUpperCase())}`],
  ])

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8ddd0;border-radius:4px;">
        <tr>
          <td style="background:#547788;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${esc(targetText)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;color:#2c3a40;font-size:22px;font-weight:600;">${esc(heading)}</h1>
            <p style="margin:0 0 20px;color:#5f727c;font-size:16px;">${intro}</p>
            ${table}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export interface LeadDigestItem {
  bookingId: string
  clientName: string
  serviceType: string
  stage: string
  statusLabel: string
  nextFollowUpDate: string | null
  needsSiteVisit: boolean
}

export function leadDigestSubject(count: number, lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? `Suivi des prospects Fresh Nest — ${count} prospect(s) à traiter aujourd'hui`
    : `Fresh Nest Lead Digest — ${count} lead(s) due or overdue today`
}

export function leadDigestHtml(items: LeadDigestItem[], todayDate: string, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const heading = isFr
    ? `Vos prospects à suivre (${todayDate})`
    : `Your leads needing follow-up (${todayDate})`
  const rows = items
    .map((item) => {
      const svc = isFr
        ? (SERVICE_FR[item.serviceType] ?? item.serviceType)
        : (SERVICE_EN[item.serviceType] ?? item.serviceType)
      const siteVisitTag = item.needsSiteVisit
        ? (isFr ? ' · Visite sur place' : ' · Site visit')
        : ''
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ddd0;color:#2c3a40;font-size:15px;">
          <strong>${esc(item.clientName)}</strong><br/>
          <span style="color:#5f727c;font-size:13px;">${esc(svc)}${esc(siteVisitTag)} · #${esc(item.bookingId.slice(0, 8).toUpperCase())}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ddd0;color:#2c3a40;font-size:14px;">${esc(item.statusLabel)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ddd0;color:#5f727c;font-size:14px;">${esc(item.nextFollowUpDate ?? '—')}</td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8ddd0;border-radius:4px;">
        <tr>
          <td style="background:#547788;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Fresh Nest Co.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#2c3a40;font-size:22px;font-weight:600;">${esc(heading)}</h1>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ddd0;border-collapse:collapse;">
              <tr style="background:#f7f3ee;">
                <th align="left" style="padding:10px 12px;color:#5f727c;font-size:13px;">${isFr ? 'Client' : 'Client'}</th>
                <th align="left" style="padding:10px 12px;color:#5f727c;font-size:13px;">${isFr ? 'Statut' : 'Status'}</th>
                <th align="left" style="padding:10px 12px;color:#5f727c;font-size:13px;">${isFr ? 'Suivi' : 'Follow-up'}</th>
              </tr>
              ${rows}
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
