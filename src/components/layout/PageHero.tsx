interface Props {
  children: React.ReactNode
  className?: string
  /** Override the inner container width class. Defaults to max-w-[1200px] mx-auto. */
  containerClass?: string
}

export default function PageHero({ children, className, containerClass = 'max-w-[1200px] mx-auto' }: Props) {
  return (
    <div className={`bg-gradient-to-br from-navy via-navy-mid to-[#004080] px-8 pt-9 pb-8 relative overflow-hidden${className ? ` ${className}` : ''}`}>
      <div
        className="absolute -top-15 -right-15 w-75 h-75 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,180,216,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px opacity-40"
        style={{ background: 'linear-gradient(90deg, transparent, #00b4d8, transparent)' }}
      />
      <div className={containerClass}>
        {children}
      </div>
    </div>
  )
}
