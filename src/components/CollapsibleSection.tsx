import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { sectionHeadingClass } from '@/constants/ui'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  /** When true, render as a static heading + content (no dropdown). Use when the section has only one logical item. */
  singleItem?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  singleItem = false,
}: CollapsibleSectionProps) {
  if (singleItem) {
    return (
      <div className="border-b border-white/10 last:border-b-0">
        <div className={'py-2.5 ' + sectionHeadingClass}>
          {title}
        </div>
        <div className="pb-3 pt-0">
          {children}
        </div>
      </div>
    )
  }
  return (
    <details
      open={defaultOpen}
      className="group border-b border-white/10 last:border-b-0"
    >
      <summary className={'list-none cursor-pointer py-2.5 flex items-center justify-between ' + sectionHeadingClass + ' hover:text-white/70 select-none'}>
        <span>{title}</span>
        <ChevronRight className="w-4 h-4 text-white/40 transition-transform duration-150 group-open:rotate-90 shrink-0" />
      </summary>
      <div className="pb-3 pt-0">
        {children}
      </div>
    </details>
  )
}
