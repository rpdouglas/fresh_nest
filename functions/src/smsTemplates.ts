const SMS_SERVICE_EN: Record<string, string> = {
  standard:         'Standard Clean',
  deep:             'Deep Clean',
  moveout:          'Move-Out Clean',
  postconstruction: 'Post-Construction',
  airbnb:           'Airbnb Turnover',
  commercial:       'Commercial Clean',
}

const SMS_SERVICE_FR: Record<string, string> = {
  standard:         'Nettoyage standard',
  deep:             'Grand ménage',
  moveout:          'Nettoyage déménagement',
  postconstruction: 'Post-construction',
  airbnb:           'Rotation Airbnb',
  commercial:       'Nettoyage commercial',
}

export function confirmationSms(
  firstName: string,
  serviceType: string,
  preferredDate: string,
  lang: 'en' | 'fr',
  quoteRequest = true,
): string {
  const service = lang === 'fr'
    ? (SMS_SERVICE_FR[serviceType] ?? serviceType)
    : (SMS_SERVICE_EN[serviceType] ?? serviceType)
  // P3-E29: public requests have no agreed price yet — say a quote will follow.
  if (quoteRequest) {
    return lang === 'fr'
      ? `Fresh Nest Co. : Bonjour ${firstName}, nous avons reçu votre demande de devis (${service}, ${preferredDate}). Nous vous contacterons dans les 24 heures. (613) 861-8812`
      : `Fresh Nest Co.: Hi ${firstName}, we received your quote request (${service}, ${preferredDate}). We'll contact you within 24 hours with your quote. (613) 861-8812`
  }
  return lang === 'fr'
    ? `Fresh Nest Co. : Bonjour ${firstName}, votre ${service} est réservé pour le ${preferredDate} ! Nous confirmerons l'heure bientôt. (613) 861-8812`
    : `Fresh Nest Co.: Hi ${firstName}, your ${service} is booked for ${preferredDate}! We'll confirm the time soon. Questions? (613) 861-8812`
}

/**
 * Owner alert for a new website quote request or a recurring renewal (always EN, like the owner
 * email). Carries the short reference the client sees on the thank-you page. No prices (P3-E29).
 */
export function ownerAlertSms(
  b: { firstName: string; lastName: string; phone: string; serviceType: string; preferredDate: string },
  docId: string,
  renewal: boolean,
): string {
  const service = SMS_SERVICE_EN[b.serviceType] ?? b.serviceType
  const ref = docId.slice(0, 8).toUpperCase()
  const who = `${b.firstName} ${b.lastName}`.trim()
  return renewal
    ? `Fresh Nest Co.: Recurring renewal — ${who}, ${service}, ${b.preferredDate}. Ref #${ref}. Confirm it in the admin panel to schedule.`
    : `Fresh Nest Co.: New quote request — ${who}, ${service}, ${b.preferredDate}, ${b.phone}. Ref #${ref}. Follow up within 24 hours.`
}

export function reminderSms(preferredDate: string, lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? `Fresh Nest Co. : Rappel — votre ménage est demain (${preferredDate}). Nous vous contacterons avec l'heure d'arrivée. (613) 861-8812`
    : `Fresh Nest Co.: Just a reminder — your cleaning is tomorrow (${preferredDate}). We'll be in touch with your arrival time. (613) 861-8812`
}

export function onMyWaySms(cleanerName: string, lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? `Fresh Nest Co. : Votre préposé(e) ${cleanerName} est en route ! Arrivée prévue près de votre plage de début programmée. (613) 861-8812`
    : `Fresh Nest Co.: Your cleaner ${cleanerName} is on the way! Estimated arrival is near your scheduled start window. (613) 861-8812`
}

