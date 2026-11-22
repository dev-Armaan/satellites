import { describe, expect, it } from 'vitest'
import { nameRule } from './build-blocker-rules'
import { BLOCKER_RULES } from './blockerRules.gen'
import { blockingRule, ruleRegExp } from './blockerNames'

describe('blocker names', () => {
  it('refuses the chunk name AdGuard blocked on 2026-11-22, and not its replacement', () => {
    expect(blockingRule('assets/clarity-CwbkIyld.js')).toBe('/clarity-*.js')
    expect(blockingRule('assets/clearness-CwbkIyld.js')).toBeUndefined()
    // Anchored at a path segment: a name that only contains the word is not blocked by `/clarity-*.js`.
    expect(blockingRule('assets/photoClarity-CwbkIyld.js')).toBeUndefined()
  })

  it('matches the way the blockers do: case-insensitive, anywhere for unanchored rules, ^ as a separator', () => {
    expect(blockingRule('assets/PIWIK-a1.js')).toBe('/piwik-')
    expect(blockingRule('assets/admin-sharebar-a1.js')).toBe('-sharebar-')
    const sep = [{ rule: '/naLogImpressions^', re: ruleRegExp('/naLogImpressions^') }]
    expect(blockingRule('assets/naLogImpressions', sep)).toBeDefined()
    expect(blockingRule('naLogImpressions/x.js', sep)).toBeDefined()
    expect(blockingRule('assets/naLogImpressions-a1.js', sep)).toBeUndefined() // '-' is not a separator
    expect(blockingRule('assets/naLogImpressionsX.js', sep)).toBeUndefined()
  })

  it('takes only rules that can hit one of our own hashed names', () => {
    expect(nameRule('/clarity-*.js')).toBe('/clarity-*.js')
    expect(nameRule('/piwik-$domain=~example.com|~example.org')).toBe('/piwik-')
    expect(nameRule('-sharebar-')).toBe('-sharebar-')
    expect(nameRule('/telemetry-$third-party')).toBeUndefined() // never on our own site
    expect(nameRule('/telemetry-$domain=example.com')).toBeUndefined() // other sites only
    expect(nameRule('||clarity.ms^')).toBeUndefined() // a host
    expect(nameRule('/index-ads.js')).toBeUndefined() // a whole name, never a hashed one
    expect(nameRule('@@/clarity-*.js$domain=clarity-project.info')).toBeUndefined()
    expect(nameRule('example.com##.ad')).toBeUndefined()
    expect(nameRule('! /clarity-*.js')).toBeUndefined()
    expect(nameRule('/naLogImpressions^')).toBeUndefined() // a separator next: never a hashed name
  })

  it('every generated rule compiles and blocks a name built from it', () => {
    expect(BLOCKER_RULES.length).toBeGreaterThan(50)
    for (const rule of BLOCKER_RULES) {
      const word = rule.replace(/^\//, '').replace(/[*^]|\.js$/g, '')
      const name = word.startsWith('-') || word.startsWith('_') ? `assets/x${word}a1.js` : `assets/${word}${/[-_]$/.test(word) ? '' : '-'}a1.js`
      expect(blockingRule(name), `${rule} → ${name}`).toBeDefined()
    }
  })
})
