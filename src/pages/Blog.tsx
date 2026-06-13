import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BLOG_POSTS } from '@/lib/data/blogData'
import SEO from '@/components/seo/SEO'
import { fadeUp, stagger } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

export default function Blog() {
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'en') as 'en' | 'fr'

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO
        title={t('blog.meta.title')}
        description={t('blog.meta.description')}
      />
      <div className="max-w-content mx-auto">
        {/* Page Heading */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-12"
        >
          <h1 className="font-display text-5xl text-charcoal mb-4 font-bold">
            {t('blog.pageHeading')}
          </h1>
          <p className="font-body text-base text-text-muted max-w-xl">
            {t('blog.pageSubhead')}
          </p>
        </motion.div>

        {/* Blog Post Cards Grid */}
        {BLOG_POSTS.length === 0 ? (
          <p className="font-body text-base text-text-muted">{t('blog.noPosts')}</p>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {BLOG_POSTS.map((post) => {
              const title = post.title[currentLang] || post.title.en
              const desc = post.description[currentLang] || post.description.en
              const author = post.author[currentLang] || post.author.en

              return (
                <motion.article
                  key={post.slug}
                  variants={fadeUp}
                  className="bg-white rounded border border-sand shadow-sm overflow-hidden flex flex-col h-full"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden relative bg-cream">
                    <img
                      src={post.image}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex flex-wrap gap-2 text-text-muted font-body text-sm mb-3">
                      <span>{t('blog.writtenBy', { author })}</span>
                      <span>•</span>
                      <span>{t('blog.publishedAt', { date: post.publishedAt })}</span>
                    </div>
                    <h2 className="font-sub text-2xl text-charcoal mb-3 font-semibold hover:text-slate-brand transition-colors">
                      <Link to={`/blog/${post.slug}`}>{title}</Link>
                    </h2>
                    <p className="font-body text-base text-charcoal mb-6 flex-grow">
                      {desc}
                    </p>
                    <div className="mt-auto">
                      <Link
                        to={`/blog/${post.slug}`}
                        className={cn(
                          'inline-flex items-center justify-center font-body font-medium text-base rounded border border-slate-brand text-slate-brand',
                          'min-h-[48px] px-6 py-2 hover:bg-slate-pale transition-colors duration-200',
                          'focus:outline-none focus:ring-2 focus:ring-slate-brand focus:ring-offset-2 w-full sm:w-auto'
                        )}
                      >
                        {t('blog.readMore')} →
                      </Link>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        )}
      </div>
    </main>
  )
}
