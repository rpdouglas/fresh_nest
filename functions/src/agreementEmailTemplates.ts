import {
  LEGAL_BUSINESS_NAME,
  OFFICE_PHONE_DISPLAY,
  formatAgreementRate,
  getAgreementFrequencyLabel,
  getAgreementServiceLabel,
  type AgreementLanguage,
  type AgreementTerms,
  type AgreementType,
} from './shared/agreements'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface AgreementInviteEmailData {
  clientName: string
  type: AgreementType
  language: AgreementLanguage
  signingUrl: string
  expiresDateText: string
}

export function agreementInviteSubject(lang: AgreementLanguage): string {
  return lang === 'fr'
    ? `Votre contrat de services ${LEGAL_BUSINESS_NAME} est prêt à signer`
    : `Your ${LEGAL_BUSINESS_NAME} Service Agreement is Ready to Sign`
}

export function agreementInviteHtml(data: AgreementInviteEmailData): string {
  const isFr = data.language === 'fr'
  const safeName = escapeHtml(data.clientName)
  const safeUrl = escapeHtml(data.signingUrl)
  const safeExpires = escapeHtml(data.expiresDateText)
  const typeLabel =
    data.type === 'commercial'
      ? isFr
        ? 'commercial'
        : 'commercial'
      : isFr
        ? 'résidentiel'
        : 'residential'

  return `<!doctype html>
<html lang="${data.language}">
<body style="margin:0;padding:24px;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;color:#2c3a40;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8ddd0;border-radius:4px;overflow:hidden;">
    <div style="background:#547788;color:#ffffff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">${LEGAL_BUSINESS_NAME}</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">${
        isFr ? 'Contrat de services prêt à signer' : 'Service Agreement Ready for Signature'
      }</p>
    </div>
    <div style="padding:28px;font-size:16px;line-height:1.6;">
      <p style="margin-top:0;">${isFr ? `Bonjour ${safeName},` : `Hello ${safeName},`}</p>
      <p>${
        isFr
          ? `Votre contrat de services ${typeLabel} avec ${LEGAL_BUSINESS_NAME} est prêt. Vous pouvez le consulter et le signer en ligne en quelques minutes à l’aide de votre lien privé ci-dessous :`
          : `Your ${typeLabel} service agreement with ${LEGAL_BUSINESS_NAME} is ready. You can review and sign it online in just a couple of minutes using your private link below:`
      }</p>
      <p style="margin:24px 0;text-align:center;">
        <a href="${safeUrl}" style="display:inline-block;background:#547788;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:16px;">
          ${isFr ? 'Consulter et signer mon contrat' : 'Review & Sign Agreement'}
        </a>
      </p>
      <p style="font-size:14px;color:#5f727c;">${
        isFr
          ? `Ce lien privé est personnel et valide jusqu’au ${safeExpires}. Aucun compte n’est requis.`
          : `This private link is personal to you and remains valid until ${safeExpires}. No account is required.`
      }</p>
      <p style="font-size:14px;color:#5f727c;">${
        isFr
          ? `Des questions ? Répondez simplement à ce courriel ou appelez-nous au ${OFFICE_PHONE_DISPLAY}.`
          : `Questions? Simply reply to this email or call us at ${OFFICE_PHONE_DISPLAY}.`
      }</p>
    </div>
  </div>
</body>
</html>`
}

export interface AgreementSignedEmailData {
  agreementId: string
  clientName: string
  clientEmail: string
  clientAddress: string
  type: AgreementType
  language: AgreementLanguage
  terms: AgreementTerms
  signedName: string
  signedAtIso: string
  versionLabel: string
  documentHash: string
}

export function agreementSignedClientSubject(lang: AgreementLanguage): string {
  return lang === 'fr'
    ? `Copie signée de votre contrat de services — ${LEGAL_BUSINESS_NAME}`
    : `Your Signed Service Agreement — ${LEGAL_BUSINESS_NAME}`
}

export function agreementSignedClientHtml(data: AgreementSignedEmailData): string {
  const isFr = data.language === 'fr'
  const safeName = escapeHtml(data.clientName)
  const safeSigned = escapeHtml(data.signedName)
  const safeService = escapeHtml(getAgreementServiceLabel(data.terms.serviceType, data.language))
  const safeFreq = escapeHtml(getAgreementFrequencyLabel(data.terms.frequency, data.language))
  const safeRate = escapeHtml(formatAgreementRate(data.terms.rateCents, data.terms.rateType, data.language))

  return `<!doctype html>
<html lang="${data.language}">
<body style="margin:0;padding:24px;background:#fdfaf6;font-family:Arial,Helvetica,sans-serif;color:#2c3a40;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e8ddd0;border-radius:4px;overflow:hidden;">
    <div style="background:#547788;color:#ffffff;padding:24px 28px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;">${LEGAL_BUSINESS_NAME}</h1>
      <p style="margin:6px 0 0;font-size:14px;opacity:0.95;">${
        isFr ? 'Confirmation de signature électronique' : 'Electronic Signature Confirmation'
      }</p>
    </div>
    <div style="padding:28px;font-size:16px;line-height:1.6;">
      <p style="margin-top:0;">${isFr ? `Bonjour ${safeName},` : `Hello ${safeName},`}</p>
      <p>${
        isFr
          ? `Merci d’avoir signé votre contrat de services avec ${LEGAL_BUSINESS_NAME}. Vous trouverez votre copie signée en format PDF en pièce jointe à ce courriel.`
          : `Thank you for signing your service agreement with ${LEGAL_BUSINESS_NAME}. A signed PDF copy is attached to this email for your records.`
      }</p>
      <div style="background:#f7f3ee;border:1px solid #e8ddd0;border-radius:4px;padding:16px;margin:20px 0;font-size:15px;">
        <div><strong>${isFr ? 'Service' : 'Service'}:</strong> ${safeService} (${safeFreq})</div>
        <div><strong>${isFr ? 'Date de début' : 'Start Date'}:</strong> ${escapeHtml(data.terms.startDate)}</div>
        <div><strong>${isFr ? 'Tarif convenu' : 'Agreed Rate'}:</strong> ${safeRate}</div>
        <div><strong>${isFr ? 'Signé par' : 'Signed By'}:</strong> ${safeSigned}</div>
      </div>
      <p style="font-size:14px;color:#5f727c;">${
        isFr
          ? 'Pour votre sécurité, les codes de porte et d’alarme ne figurent jamais dans le PDF ni dans ce courriel.'
          : 'For your security, door and alarm codes are never included in the PDF or in this email.'
      }</p>
      <p style="font-size:14px;color:#5f727c;">${
        isFr
          ? `Besoin de nous joindre ? Répondez à ce courriel ou appelez-nous au ${OFFICE_PHONE_DISPLAY}.`
          : `Need to reach us? Reply to this email or call ${OFFICE_PHONE_DISPLAY}.`
      }</p>
    </div>
  </div>
</body>
</html>`
}

export function agreementSignedOfficeSubject(data: AgreementSignedEmailData): string {
  return `[Signed Agreement] ${data.clientName} (${data.type}, ${data.language.toUpperCase()})`
}

/** Plain-text office copy. Strictly contains NO door/alarm codes or key locations. */
export function agreementSignedOfficeText(data: AgreementSignedEmailData): string {
  return [
    `Signed Service Agreement — ${LEGAL_BUSINESS_NAME}`,
    '',
    `Agreement ID: ${data.agreementId}`,
    `Client:       ${data.clientName}`,
    `Email:        ${data.clientEmail}`,
    `Address:      ${data.clientAddress}`,
    `Type:         ${data.type}`,
    `Language:     ${data.language.toUpperCase()}`,
    `Service:      ${getAgreementServiceLabel(data.terms.serviceType, 'en')} (${getAgreementFrequencyLabel(data.terms.frequency, 'en')})`,
    `Start Date:   ${data.terms.startDate}`,
    `Agreed Rate:  ${formatAgreementRate(data.terms.rateCents, data.terms.rateType, 'en')}`,
    '',
    `Signed Name:  ${data.signedName}`,
    `Signed At:    ${data.signedAtIso}`,
    `Version:      ${data.versionLabel}`,
    `SHA-256:      ${data.documentHash}`,
    '',
    'The signed PDF is attached. Any entry/alarm codes are stored separately in Admin -> Agreements.',
  ].join('\n')
}
