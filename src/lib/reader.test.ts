import { describe, expect, it } from 'vitest'
import { isReader, showTextToReader, type ReaderDocument } from './reader'
import { CRAWLER_RE } from './telemetry'

const UA = {
  googlebot: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  inspection: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 (compatible; Google-InspectionTool/1.0;)',
  bingbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  duckduck: 'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
  applebot: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  gptbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
  claudebot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  baidu: 'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  // A phone whose maker's name ends in "bot" is a visitor's.
  cubot: 'Mozilla/5.0 (Linux; Android 13; CUBOT KINGKONG 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
  headless: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
  lighthouse: 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
}

/** A document that records what was done to it. `text`: whether the build wrote the page's text into #root. */
function page(text: boolean) {
  const done: string[] = []
  const doc: ReaderDocument = {
    documentElement: { removeAttribute: (n) => void done.push(`-attr ${n}`) },
    body: { classList: { add: (n) => void done.push(`+class ${n}`) } },
    querySelector: (s) => (s === '#root > .doc' && text ? {} : null),
    getElementById: (id) => (id === 'boot-static' ? { remove: () => void done.push('-boot-static') } : null),
  }
  return { doc, done }
}

describe('isReader', () => {
  it('knows the search engines and assistants that read a page', () => {
    for (const name of ['googlebot', 'inspection', 'bingbot', 'duckduck', 'applebot', 'gptbot', 'claudebot', 'baidu'] as const) expect(isReader(UA[name]), name).toBe(true)
  })

  it('takes no visitor for one, and no page tester: they get the app', () => {
    for (const name of ['chrome', 'iphone', 'cubot', 'headless', 'lighthouse'] as const) expect(isReader(UA[name]), name).toBe(false)
    expect(isReader(undefined)).toBe(false)
    expect(isReader('')).toBe(false)
  })

  it('names nobody the usage stats would count as a visitor', () => {
    for (const [name, ua] of Object.entries(UA)) if (isReader(ua)) expect(CRAWLER_RE.test(ua), name).toBe(true)
  })
})

describe('showTextToReader', () => {
  it('makes the page\'s text the page for a reader: no loading screen, the text shown, a scrolling document', () => {
    const { doc, done } = page(true)
    expect(showTextToReader(UA.googlebot, doc)).toBe(true)
    expect(done).toEqual(['-attr data-boot', '-boot-static', '+class doc-page'])
  })

  it('leaves a visitor\'s and a page tester\'s page alone, for the app to start', () => {
    for (const ua of [UA.chrome, UA.headless, UA.lighthouse, undefined]) {
      const { doc, done } = page(true)
      expect(showTextToReader(ua, doc)).toBe(false)
      expect(done).toEqual([])
    }
  })

  it('starts the app for a reader too when the page has no text of its own', () => {
    const { doc, done } = page(false)
    expect(showTextToReader(UA.googlebot, doc)).toBe(false)
    expect(done).toEqual([])
  })
})
