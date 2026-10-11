import { describe, expect, it } from 'vitest'
import { reportUrl } from './selection-url'

describe('report URL', () => {
  it('designates the parcel from the app address', () => {
    expect(reportUrl('75107000BQ0003', 'https://ma-parcelle.fr/')).toBe(
      'https://ma-parcelle.fr/?parcelle=75107000BQ0003',
    )
  })

  it('keeps nothing from the current page that does not designate the parcel', () => {
    expect(reportUrl('75107000BQ0003', 'http://localhost:5173/app/?parcelle=33063000KJ0033&x=1#carte')).toBe(
      'http://localhost:5173/app/?parcelle=75107000BQ0003',
    )
  })
})
