/**
 * Render settings for the promo. PNG frames and a low CRF because the video is almost all type on flat ink: JPEG
 * frames and the default CRF both leave visible mosquito noise around hairlines and small mono labels.
 */
import { Config } from '@remotion/cli/config'

Config.setVideoImageFormat('png')
Config.setCrf(14)
Config.setOverwriteOutput(true)
