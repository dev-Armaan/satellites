/** A Ukrainian oblast named after its capital is kept as "<name> Oblast"; no other region gets a name of its own. */
import { describe, expect, it } from 'vitest'
import { oblastName } from './regions'

describe('oblastName', () => {
  it('names an oblast GeoNames names after its capital "<name> Oblast"', () => {
    expect(oblastName('UA.07', 'Kharkiv')).toBe('Kharkiv Oblast')
    expect(oblastName('UA.17', 'Odesa')).toBe('Odesa Oblast')
  })

  it('gives none to an oblast already so named, Crimea, the two cities or any other country’s region', () => {
    expect(oblastName('UA.13', 'Kyiv Oblast')).toBeUndefined()
    expect(oblastName('UA.11', 'Crimea')).toBeUndefined()
    expect(oblastName('UA.12', 'Kyiv City')).toBeUndefined()
    expect(oblastName('UA.20', 'Sevastopol City')).toBeUndefined()
    expect(oblastName('RU.48', 'Moscow')).toBeUndefined()
    expect(oblastName('DE.16', 'Berlin')).toBeUndefined()
  })
})
