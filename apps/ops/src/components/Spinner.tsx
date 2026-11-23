/** A spinning ring; it takes its colour from the surrounding text. */
export default function Spinner({ className = 'size-5' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-none animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-[spin_2.5s_linear_infinite] ${className}`}
    />
  )
}
