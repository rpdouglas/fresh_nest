#!/usr/bin/env node
/**
 * P3-E39 (Strategy 2): Idempotent seed script for `agreementTemplates` and published v1
 * bilingual EN/FR placeholder templates (`client-residential`, `client-commercial`).
 *
 * Usage:
 *   node functions/scripts/seed-agreement-template.cjs
 *   node functions/scripts/seed-agreement-template.cjs --db=freshnest-dev
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node functions/scripts/seed-agreement-template.cjs
 *
 * Replace placeholder text with lawyer-approved & French-reviewed v1 text before production launch.
 */

const crypto = require('node:crypto')
const { initializeApp, getApps } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex')

const RESIDENTIAL_BODY_EN = `# Master Terms — Residential Cleaning Services (Draft v1 Placeholder)

This Service Agreement ("Agreement") is entered into between **{{businessName}}** ("Fresh Nest") and **{{clientName}}** ("Client") for residential cleaning services at **{{clientAddress}}**.

## 1. Scope of Services & Schedule
- Service type: {{serviceType}} ({{frequency}}), starting {{startDate}}.
- Scope notes: {{scopeNotes}}
- Fresh Nest uses eco-conscious cleaning supplies unless the Client requests specific client-supplied products in writing.
- Fresh Nest staff do not move heavy furniture, climb above a two-step stool, or handle biohazards.

## 2. Rates, Taxes & Payment
- Agreed rate: **{{rate}}** ({{taxNote}}).
- Invoices are due upon receipt unless otherwise agreed in writing.
- Late payments may accrue interest at **{{latePaymentRate}}** per month after the due date.

## 3. Cancellations, Rescheduling & Lockouts
- Please provide at least **{{cancelWindowHours}} hours** notice to cancel or reschedule a visit.
- Cancellations with less than {{cancelWindowHours}} hours notice may incur a late cancellation fee of **{{lateCancellationFee}}**.
- If our team cannot access the home at the scheduled arrival time, a lockout fee of **{{lockoutFee}}** may apply.

## 4. Home Access, Pets & Valuables
- Any door codes, alarm codes, or key locations you share are stored in a restricted access record and never included in emailed copies or PDFs.
- Please secure pets that may be anxious around staff or equipment, and disclose fragile or high-value items prior to service.

## 5. Quality Guarantee & Liability
- If any area covered by your checklist is missed, contact us within 24 hours at {{officePhone}} and we will return to re-clean that area at no extra charge.
- Fresh Nest carries commercial general liability insurance and WSIB coverage for its employees.

## 6. Privacy & Electronic Signature Consent
- Fresh Nest collects only the personal information needed to deliver and document your services in accordance with PIPEDA and Quebec Law 25 (for Quebec clients).
- By signing electronically, you consent to execute this Agreement in electronic form and to Fresh Nest retaining your signing evidence (typed name, timestamp, IP address, browser details, and document hash) for legal record-keeping.

## 7. Termination & Governing Law
- Either party may end recurring service with **{{noticePeriodDays}} days** written notice.
- This Agreement is governed by applicable provincial and federal laws in the jurisdiction where services are performed. (Placeholder — pending final legal review.)
`

const RESIDENTIAL_BODY_FR = `# Conditions générales — Services d'entretien ménager résidentiel (Ébauche v1)

Le présent contrat de services (« Contrat ») est conclu entre **{{businessName}}** (« Fresh Nest ») et **{{clientName}}** (« Client ») pour la prestation de services d'entretien ménager résidentiel au **{{clientAddress}}**.

## 1. Portée des services et horaire
- Type de service : {{serviceType}} ({{frequency}}), à compter du {{startDate}}.
- Notes de portée : {{scopeNotes}}
- Fresh Nest utilise des produits de nettoyage écologiques, sauf demande écrite du Client pour des produits fournis sur place.
- L'équipe de Fresh Nest ne déplace pas de meubles lourds, ne monte pas au-dessus d'un escabeau à deux marches et ne manipule pas de matières biologiques dangereuses.

## 2. Tarifs, taxes et paiement
- Tarif convenu : **{{rate}}** ({{taxNote}}).
- Les factures sont payables sur réception, sauf entente écrite contraire.
- Les paiements en retard peuvent porter intérêt au taux de **{{latePaymentRate}}** par mois après l'échéance.

## 3. Annulations, reports et accès impossible
- Veuillez donner un préavis d'au moins **{{cancelWindowHours}} heures** pour annuler ou reporter une visite.
- Une annulation effectuée moins de {{cancelWindowHours}} heures avant la visite peut entraîner des frais d'annulation tardive de **{{lateCancellationFee}}**.
- Si l'équipe ne peut accéder à la résidence à l'heure prévue, des frais d'accès impossible de **{{lockoutFee}}** peuvent s'appliquer.

## 4. Accès à la résidence, animaux et objets de valeur
- Les codes de porte, codes d'alarme et emplacements de clés que vous fournissez sont conservés dans un registre d'accès restreint et ne figurent jamais dans les PDF ou courriels.
- Veuillez mettre en sécurité les animaux pouvant être craintifs et nous signaler tout objet fragile ou de grande valeur avant la visite.

## 5. Garantie de qualité et responsabilité
- Si une zone prévue à votre liste de vérification a été oubliée, communiquez avec nous dans les 24 heures au {{officePhone}} et nous reviendrons la nettoyer sans frais supplémentaires.
- Fresh Nest détient une assurance responsabilité civile commerciale ainsi que la couverture CSPAAT (WSIB) pour ses employés.

## 6. Confidentialité (LPRPDE / Loi 25 du Québec) et signature électronique
- Fresh Nest ne recueille que les renseignements personnels nécessaires à la prestation et à la documentation de vos services, conformément à la LPRPDE et à la Loi 25 du Québec.
- En signant électroniquement, vous consentez à conclure ce Contrat sous forme électronique et à ce que Fresh Nest conserve les preuves de signature (nom saisi, horodatage, adresse IP, navigateur et empreinte du document) à des fins légales.

## 7. Résiliation et droit applicable
- Chaque partie peut mettre fin aux services récurrents moyennant un préavis écrit de **{{noticePeriodDays}} jours**.
- Le présent Contrat est régi par les lois provinciales et fédérales applicables dans le territoire où les services sont rendus. (Ébauche en attente de révision juridique finale.)
`

const COMMERCIAL_BODY_EN = `# Master Terms — Commercial Cleaning Services (Draft v1 Placeholder)

This Commercial Service Agreement ("Agreement") is entered into between **{{businessName}}** ("Fresh Nest") and **{{clientName}}** ("Client") for commercial cleaning services at **{{clientAddress}}**.

## 1. Commercial Scope & Schedule
- Service type: {{serviceType}} ({{frequency}}), commencing {{startDate}}.
- Scope notes: {{scopeNotes}}
- Services are performed according to the agreed commercial checklist during the scheduled access window.

## 2. Commercial Rates, Taxes & Invoicing
- Agreed rate: **{{rate}}** ({{taxNote}}).
- Invoices are issued per agreed billing cycle and due Net 15 unless otherwise stated.
- Overdue balances may accrue interest at **{{latePaymentRate}}** per month.

## 3. Schedule Changes, Cancellations & Site Access
- At least **{{cancelWindowHours}} hours** notice is required to cancel or reschedule a scheduled commercial visit.
- Late cancellations may incur a fee of **{{lateCancellationFee}}**; site lockout fees are **{{lockoutFee}}**.
- Security credentials, alarm codes, and key locations are stored separately in a restricted office record and never included in PDFs or emails.

## 4. Insurance, Health & Safety
- Fresh Nest maintains commercial general liability insurance and WSIB coverage for all staff assigned to the premises.
- The Client agrees to maintain a safe workplace and disclose site hazards or restricted areas prior to service.

## 5. Privacy & Electronic Execution
- By signing electronically, the authorized representative consents to electronic execution and retention of signing evidence (name, server timestamp, IP address, browser details, and SHA-256 document hash).

## 6. Term & Termination
- Either party may terminate recurring commercial service with **{{noticePeriodDays}} days** written notice.
- Questions or service adjustments: contact {{officePhone}}. (Placeholder — pending final legal review.)
`

const COMMERCIAL_BODY_FR = `# Conditions générales — Services d'entretien ménager commercial (Ébauche v1)

Le présent contrat de services commerciaux (« Contrat ») est conclu entre **{{businessName}}** (« Fresh Nest ») et **{{clientName}}** (« Client ») pour des services d'entretien commercial au **{{clientAddress}}**.

## 1. Portée commerciale et horaire
- Type de service : {{serviceType}} ({{frequency}}), à compter du {{startDate}}.
- Notes de portée : {{scopeNotes}}
- Les services sont exécutés selon la liste de vérification commerciale convenue durant la plage d'accès prévue.

## 2. Tarifs commerciaux, taxes et facturation
- Tarif convenu : **{{rate}}** ({{taxNote}}).
- Les factures sont émises selon le cycle convenu et payables sous 15 jours, sauf entente écrite contraire.
- Les soldes en souffrance peuvent porter intérêt au taux de **{{latePaymentRate}}** par mois.

## 3. Modifications, annulations et accès au site
- Un préavis d'au moins **{{cancelWindowHours}} heures** est requis pour annuler ou reporter une visite commerciale.
- Les annulations tardives peuvent entraîner des frais de **{{lateCancellationFee}}** et les frais d'accès impossible s'élèvent à **{{lockoutFee}}**.
- Les codes d'accès, codes d'alarme et emplacements de clés sont conservés séparément dans un dossier sécurisé et ne figurent jamais dans les PDF ou courriels.

## 4. Assurances, santé et sécurité
- Fresh Nest maintient une assurance responsabilité civile commerciale et la couverture CSPAAT (WSIB) pour tout le personnel affecté au site.
- Le Client s'engage à maintenir un milieu de travail sécuritaire et à signaler tout risque ou zone restreinte avant le début des services.

## 5. Confidentialité et signature électronique
- En signant électroniquement, le représentant autorisé consent à la signature électronique et à la conservation des preuves de signature (nom saisi, horodatage serveur, adresse IP, navigateur et empreinte SHA-256).

## 6. Durée et résiliation
- Chaque partie peut résilier les services commerciaux récurrents moyennant un préavis écrit de **{{noticePeriodDays}} jours**.
- Pour toute question : {{officePhone}}. (Ébauche en attente de révision juridique finale.)
`

const DEFAULT_TEMPLATES = [
  {
    id: 'client-residential',
    family: 'client',
    type: 'residential',
    nameEn: 'Residential Service Agreement',
    nameFr: 'Contrat de services résidentiels',
    versionId: 'v1',
    version: 'v1',
    bodyEn: RESIDENTIAL_BODY_EN,
    bodyFr: RESIDENTIAL_BODY_FR,
  },
  {
    id: 'client-commercial',
    family: 'client',
    type: 'commercial',
    nameEn: 'Commercial Service Agreement',
    nameFr: 'Contrat de services commerciaux',
    versionId: 'v1',
    version: 'v1',
    bodyEn: COMMERCIAL_BODY_EN,
    bodyFr: COMMERCIAL_BODY_FR,
  },
]

async function seedAgreementTemplates(db, publishedBy = 'system:seed-agreement-template') {
  for (const tpl of DEFAULT_TEMPLATES) {
    const templateRef = db.collection('agreementTemplates').doc(tpl.id)
    const versionRef = templateRef.collection('versions').doc(tpl.versionId)

    const existingVersion = await versionRef.get()
    if (!existingVersion.exists) {
      await versionRef.set({
        version: tpl.version,
        status: 'published',
        bodyEn: tpl.bodyEn,
        bodyFr: tpl.bodyFr,
        bodyHashEn: sha256(tpl.bodyEn),
        bodyHashFr: sha256(tpl.bodyFr),
        publishedAt: FieldValue.serverTimestamp(),
        publishedBy,
      })
      console.log(`Created ${tpl.id}/versions/${tpl.versionId}`)
    } else {
      console.log(`Skipped ${tpl.id}/versions/${tpl.versionId} (already exists — immutable once published)`)
    }

    const existingTpl = await templateRef.get()
    if (!existingTpl.exists) {
      await templateRef.set({
        family: tpl.family,
        type: tpl.type,
        nameEn: tpl.nameEn,
        nameFr: tpl.nameFr,
        currentVersionId: tpl.versionId,
      })
      console.log(`Created agreementTemplates/${tpl.id}`)
    } else {
      console.log(`Skipped agreementTemplates/${tpl.id} (already exists)`)
    }
  }
}

module.exports = { DEFAULT_TEMPLATES, seedAgreementTemplates }

if (require.main === module) {
  const dbArg = process.argv.find((arg) => arg.startsWith('--db='))
  const databaseId = dbArg ? dbArg.slice('--db='.length) : '(default)'

  if (!getApps().length) {
    initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'freshnest-aa51e' })
  }
  const db = databaseId === '(default)' ? getFirestore() : getFirestore(databaseId)

  seedAgreementTemplates(db)
    .then(() => {
      console.log(`Agreement templates seeded in database '${databaseId}'.`)
      process.exit(0)
    })
    .catch((err) => {
      console.error('Failed to seed agreement templates:', err)
      process.exit(1)
    })
}
