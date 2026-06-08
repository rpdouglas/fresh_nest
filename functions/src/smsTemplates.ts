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
): string {
  const service = lang === 'fr'
    ? (SMS_SERVICE_FR[serviceType] ?? serviceType)
    : (SMS_SERVICE_EN[serviceType] ?? serviceType)
  return lang === 'fr'
    ? `Fresh Nest Co. : Bonjour ${firstName}, votre ${service} est réservé pour le ${preferredDate} ! Nous confirmerons l'heure bientôt. (613) 935-3555`
    : `Fresh Nest Co.: Hi ${firstName}, your ${service} is booked for ${preferredDate}! We'll confirm the time soon. Questions? (613) 935-3555`
}

export function reminderSms(preferredDate: string, lang: 'en' | 'fr'): string {
  return lang === 'fr'
    ? `Fresh Nest Co. : Rappel — votre ménage est demain (${preferredDate}). Nous vous contacterons avec l'heure d'arrivée. (613) 935-3555`
    : `Fresh Nest Co.: Just a reminder — your cleaning is tomorrow (${preferredDate}). We'll be in touch with your arrival time. (613) 935-3555`
}
