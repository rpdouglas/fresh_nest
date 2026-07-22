export interface BookingData {
  firstName: string
  lastName: string
  email: string
  phone: string
  language: string
  serviceType: string
  propertyType: string
  bedrooms: number
  bathrooms: number
  frequency: string
  preferredDate: string
  address: string
  addOns?: string[]
  notes?: string
  preferredCleaner?: string | null
  pets?: boolean
  isAirbnb?: boolean
  photoConfirmation?: boolean
  marketingConsent?: boolean
  leadSource?: string
  squareFootage?: number
  referralCode?: string | null
  referredBy?: string | null
  assignedTo?: string | null
}

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SERVICE_EN: Record<string, string> = {
  standard:         'Standard Cleaning',
  deep:             'Deep Clean',
  moveout:          'Move-Out Cleaning',
  postconstruction: 'Post-Construction',
  airbnb:           'Airbnb Turnover',
  commercial:       'Commercial Cleaning',
}

const SERVICE_FR: Record<string, string> = {
  standard:         'Nettoyage standard',
  deep:             'Nettoyage en profondeur',
  moveout:          'Nettoyage de déménagement',
  postconstruction: 'Post-construction',
  airbnb:           'Rotation Airbnb',
  commercial:       'Nettoyage commercial',
}

const FREQ_EN: Record<string, string> = {
  'one-time': 'One-time',
  weekly:     'Weekly',
  biweekly:   'Bi-weekly',
  monthly:    'Monthly',
}

const FREQ_FR: Record<string, string> = {
  'one-time': 'Ponctuel',
  weekly:     'Hebdomadaire',
  biweekly:   'Aux deux semaines',
  monthly:    'Mensuel',
}

// ── Owner notification (plain text, always EN) ────────────────────────────

export function ownerSubject(b: BookingData): string {
  const svc = SERVICE_EN[b.serviceType] ?? b.serviceType
  return `New booking — ${b.firstName} ${b.lastName} · ${svc} · ${b.preferredDate}`
}

export function ownerText(b: BookingData, docId: string): string {
  const addOns = (b.addOns ?? []).join(', ') || '—'
  return [
    'New booking received — Fresh Nest Co.',
    '',
    `Name:               ${b.firstName} ${b.lastName}`,
    `Email:              ${b.email}`,
    `Phone:              ${b.phone}`,
    `Language:           ${b.language}`,
    `Service:            ${SERVICE_EN[b.serviceType] ?? b.serviceType}`,
    `Property:           ${b.propertyType} — ${b.bedrooms}br / ${b.bathrooms}ba`,
    `Frequency:          ${b.frequency}`,
    `Preferred date:     ${b.preferredDate}`,
    `Address:            ${b.address}`,
    `Add-ons:            ${addOns}`,
    `Pets:               ${b.pets ? 'Yes' : 'No'}`,
    `Notes:              ${b.notes || '—'}`,
    `Preferred cleaner:  ${b.preferredCleaner || '—'}`,
    `Airbnb:             ${b.isAirbnb ? 'Yes' : 'No'}`,
    `Photo confirmation: ${b.photoConfirmation ? 'Yes' : 'No'}`,
    `Marketing consent:  ${b.marketingConsent ? 'Yes' : 'No'}`,
    `Lead source:        ${b.leadSource ?? '—'}`,
    `Booking ID:         ${docId}`,
  ].join('\n')
}

// ── Client confirmation (HTML, EN or FR) ─────────────────────────────────

export function clientSubject(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? 'Votre nettoyage est réservé — Fresh Nest Co.'
    : 'Your cleaning is booked — Fresh Nest Co.'
}

function detailsTable(rows: Array<[string, string]>): string {
  const rowHtml = rows.map(([label, value]) => `
              <tr>
                <td style="padding:12px 16px;color:#7a8f96;font-size:14px;width:38%;
                           border-bottom:1px solid #e8ddd0;">${label}</td>
                <td style="padding:12px 16px;color:#2c3a40;font-size:15px;
                           border-bottom:1px solid #e8ddd0;">${value}</td>
              </tr>`).join('')

  return `<table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e8ddd0;border-radius:4px;
                          margin-bottom:24px;border-collapse:collapse;">
              ${rowHtml}
            </table>`
}

export function clientHtml(b: BookingData, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const serviceName = isFr
    ? (SERVICE_FR[b.serviceType] ?? b.serviceType)
    : (SERVICE_EN[b.serviceType] ?? b.serviceType)
  const freqName = isFr
    ? (FREQ_FR[b.frequency] ?? b.frequency)
    : (FREQ_EN[b.frequency] ?? b.frequency)

  const heading    = isFr ? 'Votre réservation est confirmée !' : 'Your booking is confirmed!'
  const greeting   = isFr
    ? `Merci, ${esc(b.firstName)}. Voici les détails de votre réservation :`
    : `Thank you, ${esc(b.firstName)}. Here's what we have scheduled:`
  const nextSteps  = isFr
    ? 'Nous confirmerons l\'heure exacte dans les 24 heures.'
    : 'We\'ll confirm the exact time within 24 hours.'
  const callUs     = isFr
    ? 'Des questions ? Appelez-nous au'
    : 'Questions? Call us at'
  const signOff    = isFr ? '— L\'équipe Fresh Nest Co.' : '— The Fresh Nest Co. Team'
  const tagline    = isFr
    ? 'Services de nettoyage &amp; d\'organisation'
    : 'Cleaning &amp; Organizing Services'

  const labelService  = isFr ? 'Service'         : 'Service'
  const labelDate     = isFr ? 'Date préférée'   : 'Preferred date'
  const labelFreq     = isFr ? 'Fréquence'       : 'Frequency'
  const labelAddress  = isFr ? 'Adresse'         : 'Service address'

  const table = detailsTable([
    [labelService,  esc(serviceName)],
    [labelDate,     esc(b.preferredDate)],
    [labelFreq,     esc(freqName)],
    [labelAddress,  esc(b.address)],
  ])

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;
                    border:1px solid #e8ddd0;border-radius:4px;">

        <!-- Header -->
        <tr>
          <td style="background:#5b7e8f;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;
                      letter-spacing:0.5px;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${tagline}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;color:#2c3a40;font-size:24px;font-weight:400;">
              ${heading}
            </h1>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">${greeting}</p>
            ${table}
            <p style="margin:0 0 8px;color:#2c3a40;font-size:16px;">${nextSteps}</p>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">
              ${callUs}
              <a href="tel:+16139353555"
                 style="color:#5b7e8f;text-decoration:none;font-weight:600;">
                (613) 935-3555
              </a>
            </p>
            <p style="margin:0;color:#7a8f96;font-size:14px;">${signOff}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f3ee;
                     border-top:1px solid #e8ddd0;border-radius:0 0 4px 4px;">
            <p style="margin:0;color:#7a8f96;font-size:12px;text-align:center;">
              Fresh Nest Co. &middot; Cornwall ON &middot; (613) 935-3555
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function reviewRequestSubject(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? "Comment s'est passé votre nettoyage ? — Fresh Nest Co."
    : 'How did we do? Tell us about your cleaning — Fresh Nest Co.'
}

export function reviewRequestHtml(clientName: string, reviewUrl: string, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const heading = isFr ? 'Votre avis nous tient à cœur !' : 'We value your feedback!'
  const greeting = isFr
    ? `Bonjour ${esc(clientName)},`
    : `Hi ${esc(clientName)},`
  const bodyText = isFr
    ? "Merci d'avoir choisi Fresh Nest Co. Nous espérons que vous avez apprécié votre récent nettoyage. Veuillez prendre un moment pour nous faire part de vos commentaires. Vos avis nous aident à maintenir nos standards élevés."
    : "Thank you for choosing Fresh Nest Co. We hope you enjoyed your recent cleaning. Please take a moment to let us know how we did. Your feedback helps us maintain our high standards."
  const btnText = isFr ? 'Laisser un avis' : 'Leave a Review'
  const callUs = isFr ? 'Des questions ? Appelez-nous au' : 'Questions? Call us at'
  const signOff = isFr ? '— L\'équipe Fresh Nest Co.' : '— The Fresh Nest Co. Team'
  const tagline = isFr ? 'Services de nettoyage &amp; d\'organisation' : 'Cleaning &amp; Organizing Services'

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;
                    border:1px solid #e8ddd0;border-radius:4px;">

        <!-- Header -->
        <tr>
          <td style="background:#5b7e8f;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;
                      letter-spacing:0.5px;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${tagline}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#2c3a40;font-size:24px;font-weight:400;">
              ${heading}
            </h1>
            <p style="margin:0 0 16px;color:#2c3a40;font-size:16px;font-weight:600;">
              ${greeting}
            </p>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;line-height:1.5;">
              ${bodyText}
            </p>
            
            <!-- Button CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${reviewUrl}" 
                     style="display:inline-block;background-color:#5b7e8f;color:#ffffff;
                            font-size:16px;font-weight:600;text-decoration:none;
                            padding:14px 32px;border-radius:4px;min-height:20px;">
                    ${btnText}
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">
              ${callUs}
              <a href="tel:+16139353555"
                 style="color:#5b7e8f;text-decoration:none;font-weight:600;">
                (613) 935-3555
              </a>
            </p>
            <p style="margin:0;color:#7a8f96;font-size:14px;">${signOff}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f3ee;
                     border-top:1px solid #e8ddd0;border-radius:0 0 4px 4px;">
            <p style="margin:0;color:#7a8f96;font-size:12px;text-align:center;">
              Fresh Nest Co. &middot; Cornwall ON &middot; (613) 935-3555
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── P3-E27-D2: Probation activation (employee-facing, EN or FR) ──────────

export function probationActivationSubject(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? 'Félicitations ! Vous êtes maintenant un employé actif — Fresh Nest Co.'
    : "Congratulations! You're now an active employee — Fresh Nest Co."
}

export function probationActivationHtml(firstName: string, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const heading = isFr ? 'Bienvenue en tant qu\'employé actif !' : 'Welcome as an active employee!'
  const greeting = isFr ? `Bonjour ${esc(firstName)},` : `Hi ${esc(firstName)},`
  const bodyText = isFr
    ? "Félicitations, votre statut est maintenant actif ! Au cours des 90 prochains jours, Lauren effectuera trois suivis avec vous (aux jours 30, 60 et 90) pour voir comment vous vous adaptez et répondre à vos questions."
    : "Congratulations, your status is now active! Over the next 90 days, Lauren will check in with you three times (at Day 30, 60, and 90) to see how you're settling in and answer any questions."
  const signOff = isFr ? '— L\'équipe Fresh Nest Co.' : '— The Fresh Nest Co. Team'
  const tagline = isFr ? 'Services de nettoyage &amp; d\'organisation' : 'Cleaning &amp; Organizing Services'

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;
                    border:1px solid #e8ddd0;border-radius:4px;">

        <!-- Header -->
        <tr>
          <td style="background:#5b7e8f;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;
                      letter-spacing:0.5px;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${tagline}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#2c3a40;font-size:24px;font-weight:400;">
              ${heading}
            </h1>
            <p style="margin:0 0 16px;color:#2c3a40;font-size:16px;font-weight:600;">
              ${greeting}
            </p>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;line-height:1.5;">
              ${bodyText}
            </p>
            <p style="margin:0;color:#7a8f96;font-size:14px;">${signOff}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f3ee;
                     border-top:1px solid #e8ddd0;border-radius:0 0 4px 4px;">
            <p style="margin:0;color:#7a8f96;font-size:12px;text-align:center;">
              Fresh Nest Co. &middot; Cornwall ON &middot; (613) 935-3555
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── P3-E27-D2: Probation check-in due (admin-facing, always EN) ──────────

export function probationCheckInDueSubject(employeeName: string, dayOffset: number): string {
  return `Probation check-in due — ${employeeName} (Day ${dayOffset})`
}

export function probationCheckInDueText(employeeName: string, dayOffset: number, staffUid: string): string {
  return [
    'Fresh Nest Co. — Probation check-in reminder',
    '',
    `Employee:    ${employeeName}`,
    `Check-in:    Day ${dayOffset}`,
    `Staff UID:   ${staffUid}`,
    '',
    'Complete this check-in from the Staff Detail Panel in the admin dashboard.',
  ].join('\n')
}

// ── P3-E27-D3: Staff deactivation (admin-facing, always EN) ──────────────

export function staffDeactivatedSubject(employeeName: string): string {
  return `Staff account deactivated: ${employeeName}`
}

export function staffDeactivatedText(employeeName: string, staffUid: string): string {
  return [
    'Fresh Nest Co. — Staff account deactivated',
    '',
    `Employee:    ${employeeName}`,
    `Staff UID:   ${staffUid}`,
    '',
    'Firebase Auth access has been automatically revoked. An offboarding checklist',
    '(keys returned, access codes changed, final pay calculated) is pending in the',
    'Staff Detail Panel.',
  ].join('\n')
}

export function staffWelcomeSubject(lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? 'Bienvenue chez Fresh Nest Co. — Votre compte est prêt'
    : 'Welcome to Fresh Nest Co. — Your account is ready'
}

export function staffWelcomeHtml(firstName: string, magicLink: string, lang: 'en' | 'fr'): string {
  const isFr = lang === 'fr'
  const heading = isFr ? 'Bienvenue dans l\'équipe !' : 'Welcome to the team!'
  const greeting = isFr
    ? `Bonjour ${esc(firstName)},`
    : `Hi ${esc(firstName)},`
  const bodyText = isFr
    ? "Nous sommes ravis de vous compter parmi nous. Pour commencer, vous devez vous connecter au portail de gestion FSM en utilisant le bouton ci-dessous. Lors de votre première connexion, vous serez guidé pour soumettre votre consentement pour la vérification des antécédents et passer en revue les conditions d'utilisation de la plateforme."
    : "We are excited to have you on board! To get started, you will need to log in to the FSM portal using the button below. On your first login, you will be guided to submit your background check consent and review the platform Terms of Service."
  const btnText = isFr ? 'Se connecter pour commencer' : 'Sign in to get started'
  const callUs = isFr
    ? "Si vous avez des questions, n'hésitez pas à contacter Lauren à <a href=\"mailto:hello@freshnestco.ca\" style=\"color:#5b7e8f;text-decoration:none;\">hello@freshnestco.ca</a> ou par téléphone au"
    : "If you have any questions, feel free to contact Lauren at <a href=\"mailto:hello@freshnestco.ca\" style=\"color:#5b7e8f;text-decoration:none;\">hello@freshnestco.ca</a> or call us at"
  const signOff = isFr ? '— L\'équipe Fresh Nest Co.' : '— The Fresh Nest Co. Team'
  const tagline = isFr ? 'Services de nettoyage &amp; d\'organisation' : 'Cleaning &amp; Organizing Services'

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${esc(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fdfaf6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;
                    border:1px solid #e8ddd0;border-radius:4px;">

        <!-- Header -->
        <tr>
          <td style="background:#5b7e8f;padding:24px 32px;border-radius:4px 4px 0 0;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;
                      letter-spacing:0.5px;">Fresh Nest Co.</p>
            <p style="margin:4px 0 0;color:#d6e5ec;font-size:13px;">${tagline}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;color:#2c3a40;font-size:24px;font-weight:400;">
              ${heading}
            </h1>
            <p style="margin:0 0 16px;color:#2c3a40;font-size:16px;font-weight:600;">
              ${greeting}
            </p>
            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;line-height:1.5;">
              ${bodyText}
            </p>
            
            <!-- Button CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="${magicLink}" 
                     style="display:inline-block;background-color:#5b7e8f;color:#ffffff;
                            font-size:16px;font-weight:600;text-decoration:none;
                            padding:14px 32px;border-radius:4px;min-height:20px;">
                    ${btnText}
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;color:#7a8f96;font-size:16px;">
              ${callUs}
              <a href="tel:+16139353555"
                 style="color:#5b7e8f;text-decoration:none;font-weight:600;">
                (613) 935-3555
              </a>
            </p>
            <p style="margin:0;color:#7a8f96;font-size:14px;">${signOff}</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;background:#f7f3ee;
                     border-top:1px solid #e8ddd0;border-radius:0 0 4px 4px;">
            <p style="margin:0;color:#7a8f96;font-size:12px;text-align:center;">
              Fresh Nest Co. &middot; Cornwall ON &middot; (613) 935-3555
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
