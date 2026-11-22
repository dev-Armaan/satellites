/** Ukraine's oblasts take "Oblast" where GeoNames names them after their capitals; nothing else is renamed. */
import { describe, expect, it } from 'vitest'
import { listRegionName } from './regions'

describe('listRegionName', () => {
  it('names each Ukrainian oblast "<name> Oblast", once', () => {
    expect(listRegionName('UA.07', 'Kharkiv')).toBe('Kharkiv Oblast')
    expect(listRegionName('UA.17', 'Odesa')).toBe('Odesa Oblast')
    expect(listRegionName('UA.13', 'Kyiv Oblast')).toBe('Kyiv Oblast')
  })

  it('keeps Crimea, the two cities and every other country’s regions as GeoNames names them', () => {
    expect(listRegionName('UA.11', 'Crimea')).toBe('Crimea')
    expect(listRegionName('UA.12', 'Kyiv City')).toBe('Kyiv City')
    expect(listRegionName('UA.20', 'Sevastopol City')).toBe('Sevastopol City')
    expect(listRegionName('RU.48', 'Moscow')).toBe('Moscow')
    expect(listRegionName('DE.16', 'Berlin')).toBe('Berlin')
  })
})
