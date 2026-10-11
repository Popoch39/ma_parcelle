import { ExternalLink, FileText } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

/**
 * Lien vers le règlement écrit (PDF) du document d'urbanisme. Simple lien, jamais préchargé :
 * le fichier pèse souvent des dizaines de mégaoctets.
 */
export function ReglementLink({ href }: { href: string }) {
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
