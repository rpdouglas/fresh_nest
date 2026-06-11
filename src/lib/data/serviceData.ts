import type { QuoteServiceType } from '@/lib/utils/quotePricing'

export interface ServiceConfig {
  key: 'standard' | 'deep' | 'moveout' | 'postconstruction' | 'commercial'
  route: string
  pricingKey?: QuoteServiceType
  includedItems: readonly string[]
  isCommercial: boolean
}

const standard: ServiceConfig = {
  key: 'standard',
  route: 'standard-cleaning',
  pricingKey: 'standard',
  includedItems: ['floors', 'kitchen', 'bathrooms', 'dusting', 'trash', 'beds'],
  isCommercial: false,
}

const deep: ServiceConfig = {
  key: 'deep',
  route: 'deep-cleaning',
  pricingKey: 'deep',
  includedItems: ['everything', 'appliances', 'cabinets', 'baseboards', 'windowSills', 'fixtures', 'grout'],
  isCommercial: false,
}

const moveout: ServiceConfig = {
  key: 'moveout',
  route: 'move-out-cleaning',
  pricingKey: 'moveout',
  includedItems: ['allRooms', 'appliances', 'cupboards', 'behindAppliances', 'windowsDoorsFrames', 'checklistWalkthrough'],
  isCommercial: false,
}

const postconstruction: ServiceConfig = {
  key: 'postconstruction',
  route: 'post-construction',
  pricingKey: 'postconstruction',
  includedItems: ['dustRemoval', 'hepaVacuum', 'adhesiveRemoval', 'windows', 'vents', 'debrisRemoval'],
  isCommercial: false,
}

const commercial: ServiceConfig = {
  key: 'commercial',
  route: 'commercial-cleaning',
  includedItems: ['officeSpaces', 'washrooms', 'commonAreas', 'floorCare', 'wasteRemoval', 'flexibleScheduling'],
  isCommercial: true,
}

export const SERVICE_CONFIGS: ServiceConfig[] = [
  standard, deep, moveout, postconstruction, commercial,
]

export const SERVICE_CONFIG_MAP: Record<ServiceConfig['key'], ServiceConfig> = {
  standard, deep, moveout, postconstruction, commercial,
}
