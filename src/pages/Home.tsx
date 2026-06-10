import { useTranslation } from 'react-i18next'
import SEO from '@/components/seo/SEO'
import Hero from '@/components/home/Hero'
import TrustBar from '@/components/home/TrustBar'
import QuoteCalculator from '@/components/home/QuoteCalculator'
import ServicesGrid from '@/components/home/ServicesGrid'
import RecurringCTA from '@/components/home/RecurringCTA'
import GalleryPreview from '@/components/home/GalleryPreview'
import HowItWorks from '@/components/home/HowItWorks'
import MeetTheTeam from '@/components/home/MeetTheTeam'
import Reviews from '@/components/home/Reviews'

export default function Home() {
  const { t } = useTranslation()
  return (
    <>
      <SEO
        title={t('home.title')}
        description={t('home.description')}
      />
      <Hero />
      <TrustBar />
      <QuoteCalculator />
      <ServicesGrid />
      <RecurringCTA />
      <GalleryPreview />
      <HowItWorks />
      <MeetTheTeam />
      <Reviews />
    </>
  )
}
