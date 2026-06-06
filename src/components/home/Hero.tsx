import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import heroImg from '@/assets/hero.png'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col gap-6"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl text-charcoal leading-tight"
          >
            {t('hero.headline')}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-body text-base text-text-muted"
          >
            {t('hero.subhead')}
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to="/booking"
              className="inline-flex items-center bg-slate-brand text-white font-body font-medium rounded px-6 py-3 min-h-[48px] hover:bg-slate-dark transition-colors duration-200"
            >
              {t('common.bookNow')}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center"
        >
          <img
            src={heroImg}
            alt=""
            aria-hidden="true"
            className="rounded max-w-full h-auto"
          />
        </motion.div>
      </div>
    </section>
  )
}
