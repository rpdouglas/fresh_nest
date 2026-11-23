interface Props {
  className?: string
  size?: number
}

/**
 * The Fresh Nest Co. four-point sparkle glyph.
 * Pure vector decoration, colored via currentColor, hidden from screen readers.
 */
export default function Sparkle({ className = '', size = 16 }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block flex-none ${className}`}
    >
      <path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />
    </svg>
  )
}
