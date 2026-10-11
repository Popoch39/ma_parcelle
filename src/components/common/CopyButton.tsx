import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface CopyButtonProps {
  text: string
  /** What is being copied, for the accessible label: « Copier l'IDU ». */
  label: string
}

type CopyState = 'idle' | 'copied' | 'failed'

/** Copies a text to the clipboard in one click and briefly confirms it. */
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
      // Permission denied or insecure context: say so rather than let the user believe it worked.
      () => setState('failed'),
    )
  }

  const status = state === 'copied' ? 'Copié' : state === 'failed' ? 'Copie impossible' : ''
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={copy}
      aria-label={label}
      title={status || label}
      className="print:hidden"
    >
      {state === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
      <span role="status" className="sr-only">
        {status}
      </span>
    </Button>
  )
}
