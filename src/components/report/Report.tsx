import { Disclaimer } from '@/components/common/Disclaimer'
import { BLOCKS } from './blocks'
import { ReportSummary } from './summary/ReportSummary'

/** Content of a parcel's report, independent of its container (panel or bottom sheet). */
export function Report({ idu }: { idu: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ReportSummary idu={idu} />
      <Disclaimer />
      {BLOCKS.map(({ id, Section }) => (
        <Section key={id} idu={idu} />
      ))}
    </div>
  )
}
