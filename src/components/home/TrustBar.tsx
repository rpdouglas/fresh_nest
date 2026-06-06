import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.7,
    },
  },
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0 text-slate-brand"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      className="flex-shrink-0 text-slate-brand"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

interface TrustItem {
  key: string
  labelKey: string
  icon: 'check' | 'star'
  link?: string
}

export default function TrustBar() {
  const { t } = useTranslation()

  const items: TrustItem[] = [
    { key: 'insured',    labelKey: 'trustBar.insured',    icon: 'check' },
    { key: 'background', labelKey: 'trustBar.background', icon: 'check' },
    { key: 'eco',        labelKey: 'trustBar.eco',        icon: 'check', link: '/services' },
    { key: 'guarantee',  labelKey: 'trustBar.guarantee',  icon: 'check' },
    { key: 'rating',     labelKey: 'trustBar.rating',     icon: 'star'  },
    { key: 'bilingual',  labelKey: 'trustBar.bilingual',  icon: 'check' },
  ]

  return (
    <section aria-label={t('trustBar.ariaLabel')} className="bg-cream border-y border-sand">
      <div className="max-w-content mx-auto py-4 px-4 md:py-6 md:px-6">
        <motion.ul
          role="list"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8 list-none m-0 p-0"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {items.map((item) => {
            const Icon = item.icon === 'star' ? StarIcon : CheckIcon
            return (
              <motion.li key={item.key} variants={fadeUp}>
                {item.link ? (
                  <Link
                    to={item.link}
                    className="flex items-center gap-2 group min-h-[48px] md:min-h-0 focus:outline-none focus:ring-2 focus:ring-slate-brand rounded"
                  >
                    <Icon />
                    <span className="font-body text-base text-charcoal group-hover:underline decoration-slate-brand underline-offset-2">
                      {t(item.labelKey)}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 min-h-[48px] md:min-h-0">
                    <Icon />
                    <span className="font-body text-base text-charcoal">
                      {t(item.labelKey)}
                    </span>
                  </div>
                )}
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
