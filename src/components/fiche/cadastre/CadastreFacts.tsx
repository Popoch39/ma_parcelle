import type { Parcelle } from '@/api/cadastre'
import { CopyButton } from '@/components/common/CopyButton'
import { Fact } from '@/components/common/Fact'

const integer = new Intl.NumberFormat('fr-FR')

/** Faits cadastraux d'une parcelle. */
export function CadastreFacts({ parcelle }: { parcelle: Parcelle }) {
  const { commune, arrondissement } = parcelle
  return (
    <dl className="text-sm">
      <Fact label="Contenance">{integer.format(parcelle.contenance)} m²</Fact>
      <Fact label="Commune">
        {commune.nom} <span className="text-muted-foreground">({commune.codeInsee})</span>
      </Fact>
      {arrondissement && (
        <Fact label="Arrondissement">
          {arrondissement.nom} <span className="text-muted-foreground">({arrondissement.codeInsee})</span>
        </Fact>
      )}
      {parcelle.prefixe !== '000' && <Fact label="Préfixe">{parcelle.prefixe}</Fact>}
      <Fact label="Section">{parcelle.section}</Fact>
      <Fact label="Feuille">{parcelle.feuille}</Fact>
      <Fact label="Numéro">{Number(parcelle.numero)}</Fact>
      <Fact label="Référence cadastrale">
        {parcelle.referenceCadastrale}
        <CopyButton text={parcelle.referenceCadastrale} label="Copier la référence cadastrale" />
      </Fact>
      <Fact label="IDU">
        <span className="font-mono">{parcelle.idu}</span>
        <CopyButton text={parcelle.idu} label="Copier l’IDU" />
      </Fact>
    </dl>
  )
}
