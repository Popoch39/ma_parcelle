import type { Batiment, BatimentBloc } from '@/api/batiment'
import { Fact } from '@/components/common/Fact'

const metres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function Manquant({ children }: { children: string }) {
  return <span className="font-normal text-muted-foreground">{children}</span>
}

function BatimentGroupeFacts({ batiment }: { batiment: Batiment }) {
  return (
    <dl className="text-sm">
      <Fact label="Année de construction">
        {batiment.anneeConstruction ?? <Manquant>Non renseignée</Manquant>}
      </Fact>
      <Fact label="Hauteur moyenne">
        {batiment.hauteurMoyenne === null ? (
          <Manquant>Non renseignée</Manquant>
        ) : (
          `${metres.format(batiment.hauteurMoyenne)} m`
        )}
      </Fact>
      <Fact label="Classe énergétique (DPE)">{batiment.classeDpe ?? <Manquant>Aucun DPE</Manquant>}</Fact>
    </dl>
  )
}

/** Faits du bloc Bâtiment : altitude de la parcelle et bâtiments recensés par la BDNB. */
export function BatimentFacts({ bloc }: { bloc: BatimentBloc }) {
  const { batiments, altitude } = bloc
  return (
    <div className="flex flex-col gap-3 text-sm">
      <dl>
        <Fact label="Altitude du sol">
          {altitude === null ? <Manquant>Indisponible</Manquant> : `${metres.format(altitude)} m`}
        </Fact>
      </dl>
      {batiments.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun bâtiment recensé sur cette parcelle : terrain nu, ou bâti absent de la BDNB.
        </p>
      ) : batiments.length === 1 ? (
        <BatimentGroupeFacts batiment={batiments[0]} />
      ) : (
        <ul className="flex flex-col gap-3">
          {batiments.map((batiment, index) => (
            <li key={batiment.id}>
              <h3 className="text-xs font-medium text-muted-foreground">
                Bâtiment {index + 1} sur {batiments.length}
                {batiment.adresse && ` · ${batiment.adresse}`}
              </h3>
              <BatimentGroupeFacts batiment={batiment} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
