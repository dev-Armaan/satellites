/**
 * Vitest setup (both configs): hands the share card's headline measure to api/_lib/cardSpec.ts before a test file
 * runs, as api/og.tsx does for the server card. The app hands it in only with a share (src/ui/share/measure.ts), so
 * cardSpec does not import it itself; without this, every test that builds a card would have to.
 */
import * as cardMeasure from '../api/_lib/cardMeasure'
import { provideCardMeasure } from '../api/_lib/cardSpec'

provideCardMeasure(cardMeasure)
