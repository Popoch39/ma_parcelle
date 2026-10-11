import { ExternalLink, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * Link to the written rules (PDF) of the planning document. A plain link, never preloaded:
 * the file often weighs tens of megabytes.
 */
export function RulesLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={buttonVariants({ variant: 'outline', size: 'sm', className: 'self-start' })}
    >
      <FileText aria-hidden />
      Règlement écrit (PDF)
      <ExternalLink aria-hidden />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}
