import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

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
    <section className="bg-warm-white py-16 px-4 md:py-24 md:px-6 overflow-hidden relative">
      <div className="relative max-w-3xl mx-auto text-center flex flex-col items-center gap-8 min-h-[300px] justify-center">
        {/* Soft Translucent watermark background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[450px] md:h-[450px] pointer-events-none z-0">
          <img
            src="/images/nest-watermark.jpg"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain mix-blend-multiply"
            style={{ opacity: 0.12 }}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-6xl text-charcoal leading-tight max-w-2xl"
          >
            {t('hero.headline')}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="font-body text-lg text-text-muted max-w-xl leading-relaxed"
          >
            {t('hero.subhead')}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-2">
            <Link
              to="/booking"
              className="inline-flex items-center bg-slate-brand text-white font-body font-medium rounded px-8 py-4 min-h-[48px] hover:bg-slate-dark transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 focus:ring-offset-warm-white"
            >
              {t('common.bookNow')}
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
