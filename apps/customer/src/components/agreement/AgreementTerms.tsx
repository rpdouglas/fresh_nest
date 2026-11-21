import { useTranslation } from 'react-i18next'
import { parseMarkdownLite } from '@freshnest/shared'

interface AgreementTermsProps {
  body: string
}

/** Renders bold **inline** spans safely without raw HTML. */
function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-charcoal">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={idx}>{part}</span>
  })
}

export function AgreementTerms({ body }: AgreementTermsProps) {
  const { t } = useTranslation()
  const blocks = parseMarkdownLite(body)

  return (
    <section
      aria-labelledby="agreement-terms-heading"
      className="bg-white border border-sand rounded p-5 md:p-8 space-y-5"
    >
      <h2 id="agreement-terms-heading" className="font-sub text-2xl text-charcoal border-b border-sand pb-3">
        {t('agreement.terms.heading')}
      </h2>

      <div className="space-y-4 font-body text-base text-charcoal leading-relaxed">
        {blocks.map((block, index) => {
          if (block.type === 'h1') {
            return (
              <h3 key={index} className="font-display text-2xl md:text-3xl text-charcoal pt-2">
                {block.text}
              </h3>
            )
          }
          if (block.type === 'h2') {
            return (
              <h4 key={index} className="font-sub text-xl text-charcoal pt-3 border-t border-sand">
                {block.text}
              </h4>
            )
          }
          if (block.type === 'h3') {
            return (
              <h5 key={index} className="font-body text-base font-semibold text-charcoal pt-2">
                {block.text}
              </h5>
            )
          }
          if (block.type === 'divider') {
            return <hr key={index} className="border-sand my-4" />
          }
          if (block.type === 'list') {
            return (
              <ul key={index} className="list-disc pl-6 space-y-2">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="font-body text-base text-charcoal">
                    {renderInlineBold(item)}
                  </li>
                ))}
              </ul>
            )
          }
          return (
            <p key={index} className="font-body text-base text-charcoal">
              {renderInlineBold(block.text)}
            </p>
          )
        })}
      </div>
    </section>
  )
}
