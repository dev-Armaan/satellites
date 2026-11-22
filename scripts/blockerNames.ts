/**
 * The build refuses to emit a file whose name an ad-block or tracker list would block.
 *
 * The bundler names each shared chunk after its module, so renaming a file in src/ quietly renames a file on the site.
 * A list rule aimed at someone's tracker can then block one of our own files. A blocked chunk fails like a missing
 * one, and retrying never helps. It happened on 2026-11-22: AdGuard Tracking Protection's `/clarity-*.js` (Microsoft
 * Clarity) blocked src/lib/clarity.ts's chunk, which the results panel and the globe both import, so those visitors
 * got the fault notice after every search, and no globe (now src/lib/clearness.ts).
 *
 * The rules are the lists' own (scripts/blockerRules.gen.ts, from scripts/build-blocker-rules.ts), matched the way the
 * blockers do: against the file's path, case-insensitive, `*` any run of characters, `^` a separator or the end. When
 * the build fails here, rename the module the chunk is named after (the error names the file and the rule). Don't
 * pin the name in the bundler's config: a blocker sees the URL, not why we chose it.
 */
import type { Plugin } from 'vite'
import { BLOCKER_RULES } from './blockerRules.gen.ts'

/** A list rule (its pattern, options already dropped) as a RegExp over a path, as the blockers read it. */
export function ruleRegExp(rule: string): RegExp {
  let src = ''
  for (const ch of rule) {
    if (ch === '*') src += '.*'
    else if (ch === '^') src += '(?:[^\\w.%-]|$)'
    else src += ch.replace(/[.+?()[\]{}|\\$]/g, '\\$&')
  }
  return new RegExp(src, 'i')
}

const COMPILED = BLOCKER_RULES.map((rule) => ({ rule, re: ruleRegExp(rule) }))

/** The rule that would block the output file `fileName` (as the bundle names it: `assets/x-hash.js`), if any. */
export function blockingRule(fileName: string, rules: readonly { rule: string; re: RegExp }[] = COMPILED): string | undefined {
  const path = `/${fileName.replace(/^\/+/, '')}`
  return rules.find(({ re }) => re.test(path))?.rule
}

/** Fails the build on any emitted file (chunks, CSS, workers, fonts) a blocker would refuse by name. */
export function blockerNames(): Plugin {
  return {
    name: 'blocker-names',
    apply: 'build',
    generateBundle(_options, bundle) {
      const hits = Object.keys(bundle).flatMap((f) => {
        const rule = blockingRule(f)
        return rule ? [`${f} (rule ${rule})`] : []
      })
      if (hits.length)
        this.error(`ad blockers would refuse ${hits.join(', ')}: rename the module the file is named after (scripts/blockerNames.ts)`)
    },
  }
}
