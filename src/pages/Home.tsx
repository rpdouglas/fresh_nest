import Hero from '@/components/home/Hero'
import TrustBar from '@/components/home/TrustBar'
import QuoteCalculator from '@/components/home/QuoteCalculator'
import ServicesGrid from '@/components/home/ServicesGrid'
import RecurringCTA from '@/components/home/RecurringCTA'

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <QuoteCalculator />
      <ServicesGrid />
      <RecurringCTA />
    </>
  )
}
