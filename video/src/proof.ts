/**
 * The captured proof (scripts/capture-proof.cjs): where a screenshot is, and how big each one is.
 *
 * The sizes are read at render time from the file the capture writes beside the images, not imported, because the
 * captures are generated and uncommitted: an import would break the build on a fresh checkout, while a missing file
 * here only means a scene falls back to type (the press cards) or shows nothing (the flood).
 */
import { staticFile, type CalculateMetadataFunction } from 'remotion'

/** Capture name → its pixel width and height. */
export type Sizes = Record<string, [number, number]>

export interface ProofProps extends Record<string, unknown> {
  sizes: Sizes
}

export const shot = (name: string) => staticFile(`proof/${name}.png`)

/** Every composition takes the capture sizes as a prop, resolved once before rendering. */
export const withProof: CalculateMetadataFunction<ProofProps> = async () => {
  try {
    const sizes = (await (await fetch(staticFile('proof/sizes.json'))).json()) as Sizes
    return { props: { sizes } }
  } catch {
    return { props: { sizes: {} } }
  }
}
