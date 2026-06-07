interface TeamAvatarProps {
  src: string | null
  alt: string
  initials: string
}

export default function TeamAvatar({ src, alt, initials }: TeamAvatarProps) {
  if (src) {
    return (
      <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
    )
  }
  return (
    <div aria-hidden="true" className="w-full h-full flex items-center justify-center bg-slate-pale">
      {initials ? (
        <span className="font-display text-4xl text-slate-brand select-none">{initials}</span>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-12 h-12 text-slate-brand"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  )
}
