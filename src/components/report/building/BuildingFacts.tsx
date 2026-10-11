import type { Building, BuildingBlock } from '@/api/building'
import { Fact } from '@/components/common/Fact'

const meters = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

function Missing({ children }: { children: string }) {
  return <span className="font-normal text-muted-foreground">{children}</span>
}

function BuildingGroupFacts({ building }: { building: Building }) {
  return (
    <dl className="text-sm">
      <Fact label="Année de construction">
        {building.constructionYear ?? <Missing>Non renseignée</Missing>}
      </Fact>
      <Fact label="Hauteur moyenne">
        {building.meanHeight === null ? (
          <Missing>Non renseignée</Missing>
        ) : (
          `${meters.format(building.meanHeight)} m`
        )}
      </Fact>
      <Fact label="Classe énergétique (DPE)">{building.dpeClass ?? <Missing>Aucun DPE</Missing>}</Fact>
    </dl>
  )
}

/** Facts of the Building block: elevation of the parcel and buildings recorded by the BDNB. */
export function BuildingFacts({ block }: { block: BuildingBlock }) {
  const { buildings, altitude } = block
  return (
    <div className="flex flex-col gap-3 text-sm">
      <dl>
        <Fact label="Altitude du sol">
          {altitude === null ? <Missing>Indisponible</Missing> : `${meters.format(altitude)} m`}
        </Fact>
      </dl>
      {buildings.length === 0 ? (
        <p className="text-muted-foreground">
          Aucun bâtiment recensé sur cette parcelle : terrain nu, ou bâti absent de la BDNB.
        </p>
      ) : buildings.length === 1 ? (
        <BuildingGroupFacts building={buildings[0]} />
      ) : (
        <ul className="flex flex-col gap-3">
          {buildings.map((building, index) => (
            <li key={building.id}>
              <h3 className="text-xs font-medium text-muted-foreground">
                Bâtiment {index + 1} sur {buildings.length}
                {building.address && ` · ${building.address}`}
              </h3>
              <BuildingGroupFacts building={building} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
