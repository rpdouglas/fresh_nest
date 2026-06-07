export interface Review {
  id: string
  name: string
  location: string
  language: 'en' | 'fr'
  rating: number
  text: string
}

export const STATIC_REVIEWS: Review[] = [
  {
    id: 'linda-m',
    name: 'Linda M.',
    location: 'Cornwall, ON',
    language: 'en',
    rating: 5,
    text: "Same cleaner every visit, exactly on schedule. I was nervous letting someone into my home, but Fresh Nest put me at ease right away. Highly recommend.",
  },
  {
    id: 'dean-g',
    name: 'Dean G.',
    location: 'South Glengarry — Airbnb Host',
    language: 'en',
    rating: 5,
    text: "Our Airbnb is turned over perfectly every time, always within the window. Guest review scores have jumped since we switched. Worth every cent.",
  },
  {
    id: 'marie-claire-b',
    name: 'Marie-Claire B.',
    location: 'Cornwall, ON',
    language: 'fr',
    rating: 5,
    text: "Service impeccable du début à la fin. Le même nettoyeur à chaque visite, toujours ponctuel. Je n'aurais pas pu demander mieux.",
  },
  {
    id: 'emilie-t',
    name: 'Émilie T.',
    location: 'Snye, QC',
    language: 'fr',
    rating: 5,
    text: "Je suis de l'autre côté de la rivière et ils font quand même le déplacement ! Produits écologiques, équipe souriante. Cinq étoiles sans hésitation.",
  },
  {
    id: 'james-a',
    name: 'James A.',
    location: 'Akwesasne',
    language: 'en',
    rating: 5,
    text: "They actually came to the island — no other service in the area would. Deep clean before a big family gathering. Spotless result.",
  },
]
