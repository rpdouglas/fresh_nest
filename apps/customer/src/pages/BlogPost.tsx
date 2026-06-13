import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
import { BLOG_POSTS } from '@/lib/data/blogData'
import SEO from '@/components/seo/SEO'
import { fadeUp } from '@/lib/utils/animations'
import { cn } from '@/lib/utils/utils'

// A simple Markdown parser component that handles paragraphs, headers (###), bold text (**), and lists (-).
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.trim().split('\n')
  const elements: React.ReactNode[] = []

  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-6 mb-6 space-y-2 font-body text-base text-charcoal">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
  }

  // Parses bold tags **text** into <strong>text</strong>
  const formatInlineMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  lines.forEach((line, idx) => {
    const trimmedLine = line.trim()

    if (trimmedLine.startsWith('- ')) {
      listItems.push(trimmedLine.substring(2))
    } else {
      flushList(String(idx))

      if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3
            key={idx}
            className="font-sub text-2xl text-charcoal mt-8 mb-4 font-semibold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(4)) }}
          />
        )
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2
            key={idx}
            className="font-display text-3xl text-charcoal mt-10 mb-4 font-bold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(3)) }}
          />
        )
      } else if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1
            key={idx}
            className="font-display text-4xl text-charcoal mt-12 mb-4 font-bold"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine.substring(2)) }}
          />
        )
      } else if (trimmedLine === '') {
        // Empty line, do nothing
      } else {
        elements.push(
          <p
            key={idx}
            className="font-body text-base text-charcoal mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmedLine) }}
          />
        )
      }
    }
  })

  // Flush any remaining list items at the end
  flushList('end')

  return <div>{elements}</div>
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { t, i18n } = useTranslation()
  const currentLang = (i18n.language || 'en') as 'en' | 'fr'

  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    return (
      <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
        <SEO
          title={t('blog.meta.title')}
          description={t('blog.meta.description')}
        />
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display text-4xl text-charcoal mb-6 font-bold">
            {t('blog.noPosts')}
          </h1>
          <Link
            to="/blog"
            className={cn(
              'inline-flex items-center justify-center font-body font-medium text-base rounded bg-slate-brand text-white',
              'min-h-[48px] px-6 py-3 hover:bg-slate-dark transition-colors duration-200'
            )}
          >
            {t('blog.backToBlog')}
          </Link>
        </div>
      </main>
    )
  }

  const title = post.title[currentLang] || post.title.en
  const desc = post.description[currentLang] || post.description.en
  const author = post.author[currentLang] || post.author.en
  const content = post.content[currentLang] || post.content.en
  const readTime = post.readTime[currentLang] || post.readTime.en

  return (
    <main className="bg-warm-white py-12 px-4 md:py-20 md:px-6">
      <SEO
        title={t('blog.metaPost', { title })}
        description={desc}
      />
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="mb-8"
        >
          <Link
            to="/blog"
            className={cn(
              'inline-flex items-center font-body text-base text-slate-brand hover:text-slate-dark transition-colors',
              'min-h-[48px]'
            )}
          >
            {t('blog.backToBlog')}
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.article
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="bg-white rounded border border-sand shadow-sm p-6 md:p-10"
        >
          <header className="mb-8 border-b border-sand pb-8">
            <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-4 font-bold leading-tight">
              {title}
            </h1>
            <div className="flex flex-wrap gap-4 text-text-muted font-body text-base">
              <span>{t('blog.writtenBy', { author })}</span>
              <span>•</span>
              <span>{t('blog.publishedAt', { date: post.publishedAt })}</span>
              <span>•</span>
              <span>{readTime}</span>
            </div>
          </header>

          {/* Cover Image */}
          <div className="aspect-[21/9] w-full overflow-hidden rounded mb-8 bg-cream border border-sand">
            <img
              src={post.image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Article Content */}
          <div className="prose max-w-none">
            <MarkdownRenderer content={content} />
          </div>
        </motion.article>
      </div>
    </main>
  )
}
