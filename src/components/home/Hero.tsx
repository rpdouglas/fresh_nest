import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import logoHero from '@/assets/logo-hero-340px.png'

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
    <section className="bg-warm-white py-12 px-4 md:py-16 md:px-6 overflow-hidden relative">
      <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6 min-h-[300px] justify-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 flex flex-col items-center gap-6 w-full"
        >
          {/* Main title container with nest watermark behind it */}
          <div className="relative w-full py-4 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-visible">
              <img
                src="/images/nest-watermark.jpg"
                alt=""
                aria-hidden="true"
                className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] object-contain mix-blend-multiply"
                style={{ opacity: 0.25 }}
              />
            </div>
            <motion.h1
              variants={fadeUp}
              className="relative z-10 font-display text-5xl md:text-6xl text-charcoal leading-tight max-w-2xl text-center"
            >
              {t('hero.headline')}
            </motion.h1>
          </div>

          <motion.p
            variants={fadeUp}
            className="font-body text-xl font-bold text-charcoal max-w-xl leading-relaxed"
          >
            {t('hero.subhead')}
          </motion.p>

          {/* Hero logo under subtitle, above Book Now button */}
          <motion.div
            variants={fadeUp}
            className="w-full max-w-[280px] md:max-w-[340px] my-2"
          >
            <img
              src={logoHero}
              alt="Fresh Nest Co."
              className="w-full h-auto object-contain mx-auto"
            />
          </motion.div>

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
