import type { Parcel } from '@/api/cadastre'
import { CopyButton } from '@/components/common/CopyButton'
import { Fact } from '@/components/common/Fact'

const integer = new Intl.NumberFormat('fr-FR')

/** Cadastral facts of a parcel. */
export function CadastreFacts({ parcel }: { parcel: Parcel }) {
  const { municipality, district } = parcel
  return (
    <dl className="text-sm">
      <Fact label="Contenance">{integer.format(parcel.area)} m²</Fact>
      <Fact label="Commune">
        {municipality.name} <span className="text-muted-foreground">({municipality.inseeCode})</span>
      </Fact>
      {district && (
        <Fact label="Arrondissement">
          {district.name} <span className="text-muted-foreground">({district.inseeCode})</span>
        </Fact>
      )}
      {parcel.prefix !== '000' && <Fact label="Préfixe">{parcel.prefix}</Fact>}
      <Fact label="Section">{parcel.section}</Fact>
      <Fact label="Feuille">{parcel.sheet}</Fact>
      <Fact label="Numéro">{Number(parcel.number)}</Fact>
      <Fact label="Référence cadastrale">
        {parcel.cadastralReference}
        <CopyButton text={parcel.cadastralReference} label="Copier la référence cadastrale" />
      </Fact>
      <Fact label="IDU">
        <span className="font-mono">{parcel.idu}</span>
        <CopyButton text={parcel.idu} label="Copier l’IDU" />
      </Fact>
    </dl>
  )
}
