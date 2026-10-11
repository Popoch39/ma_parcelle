import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
  /** Ce que l'on copie, pour le libellé accessible : « Copier l'IDU ». */
  label: string
}

type CopyState = 'idle' | 'copied' | 'failed'

/** Copie un texte dans le presse-papiers en un clic et le confirme brièvement. */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 1500)
    return () => clearTimeout(timer)
  }, [state])

  const copy = () => {
    navigator.clipboard.writeText(text).then(
      () => setState('copied'),
      // Refus de permission ou contexte non sécurisé : on le dit plutôt que de laisser croire.
      () => setState('failed'),
    )
  }

  const status = state === 'copied' ? 'Copié' : state === 'failed' ? 'Copie impossible' : ''
  return (
    <Button variant="ghost" size="icon-xs" onClick={copy} aria-label={label} title={status || label}>
      {state === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span role="status" className="sr-only">
        {status}
      </span>
    </Button>
  )
}
