import type { ServiceType } from '@/types'

export interface LocationConfig {
  slug: string
  headingKey: string
  subheadKey: string
  descriptionKey: string
  pageTitleKey: string
  metaDescKey: string
  mapQuery: string
  calloutKey?: string
  services: ServiceType[]
}

export const CORNWALL_ON: LocationConfig = {
  slug: 'cornwall-on',
  headingKey: 'locations.cornwallOn.heading',
  subheadKey: 'locations.cornwallOn.subhead',
  descriptionKey: 'locations.cornwallOn.description',
  pageTitleKey: 'locations.cornwallOn.pageTitle',
  metaDescKey: 'locations.cornwallOn.metaDesc',
  mapQuery: 'Cornwall+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'postconstruction', 'airbnb', 'commercial'],
}

export const AKWESASNE: LocationConfig = {
  slug: 'akwesasne',
  headingKey: 'locations.akwesasne.heading',
  subheadKey: 'locations.akwesasne.subhead',
  descriptionKey: 'locations.akwesasne.description',
  pageTitleKey: 'locations.akwesasne.pageTitle',
  metaDescKey: 'locations.akwesasne.metaDesc',
  mapQuery: 'Cornwall+Island+Akwesasne+Ontario',
  calloutKey: 'locations.akwesasne.islandNote',
  services: ['standard', 'deep', 'moveout', 'postconstruction'],
}

export const SNYE_QC: LocationConfig = {
  slug: 'snye-qc',
  headingKey: 'locations.snyeQc.heading',
  subheadKey: 'locations.snyeQc.subhead',
  descriptionKey: 'locations.snyeQc.description',
  pageTitleKey: 'locations.snyeQc.pageTitle',
  metaDescKey: 'locations.snyeQc.metaDesc',
  mapQuery: 'Snye+Quebec+Akwesasne',
  calloutKey: 'locations.snyeQc.borderNote',
  services: ['standard', 'deep', 'moveout'],
}

export const LONG_SAULT: LocationConfig = {
  slug: 'long-sault',
  headingKey: 'locations.longSault.heading',
  subheadKey: 'locations.longSault.subhead',
  descriptionKey: 'locations.longSault.description',
  pageTitleKey: 'locations.longSault.pageTitle',
  metaDescKey: 'locations.longSault.metaDesc',
  mapQuery: 'Long+Sault+Ontario+Canada',
  services: ['standard', 'deep', 'moveout', 'airbnb'],
}

export const MORRISBURG: LocationConfig = {
  slug: 'morrisburg',
  headingKey: 'locations.morrisburg.heading',
  subheadKey: 'locations.morrisburg.subhead',
  descriptionKey: 'locations.morrisburg.description',
  pageTitleKey: 'locations.morrisburg.pageTitle',
  metaDescKey: 'locations.morrisburg.metaDesc',
  mapQuery: 'Morrisburg+Ontario+Canada',
  services: ['standard', 'deep', 'moveout'],
}

export const ALL_LOCATIONS: LocationConfig[] = [
  CORNWALL_ON,
  AKWESASNE,
  SNYE_QC,
  LONG_SAULT,
  MORRISBURG,
]
