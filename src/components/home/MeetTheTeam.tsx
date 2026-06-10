import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import TeamAvatar from '@/components/ui/TeamAvatar'

interface TeamMember {
  id: string
  name: string
  roleKey: string
  bioKey: string
  initials: string
  photoSrc: string | null
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'lauren',
    name: 'Lauren S.',
    roleKey: 'team.members.lauren.role',
    bioKey: 'team.members.lauren.bio',
    initials: 'L',
    photoSrc: '/images/team/lauren.png',
  },
  {
    id: 'sarah',
    name: 'Sarah M.',
    roleKey: 'team.members.sarah.role',
    bioKey: 'team.members.sarah.bio',
    initials: 'S',
    photoSrc: '/images/team/sarah.png',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function MeetTheTeam() {
  const { t } = useTranslation()

  return (
    <section aria-label={t('team.ariaLabel')} className="bg-cream py-12 px-4 md:py-20 md:px-6">
      <div className="max-w-content mx-auto">

        {/* Section heading */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-8"
        >
          <h2 className="font-display text-4xl text-charcoal mb-4">{t('team.sectionHeading')}</h2>
          <p className="font-body text-base text-text-muted">{t('team.sectionSubhead')}</p>
        </motion.div>

        {/* Consistent-assignment callout */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={fadeUp}
          className="mb-10"
        >
          <div className="flex items-start gap-4 bg-slate-pale border border-sand rounded p-6">
            <div className="shrink-0 mt-0.5" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-slate-brand"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="flex-1 font-body text-base text-charcoal">{t('team.assignmentNote')}</p>
            <Link
              to="/booking"
              className="shrink-0 inline-flex items-center font-body font-medium text-base
                         text-slate-brand hover:text-slate-dark underline underline-offset-2
                         transition-colors min-h-[48px] focus:outline-none focus:ring-2
                         focus:ring-slate-brand rounded px-1"
            >
              {t('common.bookNow')}
            </Link>
          </div>
        </motion.div>

        {/* Team member cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {TEAM_MEMBERS.map(member => (
            <motion.div key={member.id} variants={fadeUp}>
              <article className="bg-white border border-sand rounded shadow-sm overflow-hidden">
                <div className="aspect-square">
                  <TeamAvatar
                    src={member.photoSrc}
                    alt={t('team.photoAlt', { name: member.name })}
                    initials={member.initials}
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-sub text-2xl text-charcoal mb-1">{member.name}</h3>
                  <p className="font-body text-sm font-medium text-slate-brand mb-3">
                    {t(member.roleKey)}
                  </p>
                  <p className="font-body text-base text-text-muted">{t(member.bioKey)}</p>
                </div>
              </article>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
