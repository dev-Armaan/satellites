"""
Cuts the song's excerpt for the video: public/music/track.wav, from a copy of Queen's "Don't Stop Me Now" (owner's
choice of song; the recording is not in the repository and neither is the excerpt).

    python3 scripts/cut-music.py <the song: any audio or video file ffmpeg can read>

Why this excerpt: it is one unbroken stretch, so there is no splice to hear, and its eleven bars happen to be the
video. It starts on the downbeat of the third "Don't stop me now" of the first chorus, runs through "I don't want to
stop at all" and the drum fill, and into the second verse: "I'm a rocket ship on my way to Mars, on a collision
course, I am a satellite, I'm out of control". src/timing.ts lays the scenes over those bars (the line about the
satellite is sung over the globe).

How it ends: on the last hit of the bar that sings "out of control", just before the next line's pickup. The music is
cut there and what was just played rings on as a reverb tail, so it stops like a stop and not like a fade.

Times are for the studio recording with the lyric video's lead-in (the first downbeat used is 83.97 s in); a different
copy of the song will need START moved. The beat (0.38207 s, 157.04 BPM) and the downbeats were measured with librosa
(a beat tracker, then a straight-line fit through 45 beats; the fit is what src/timing.ts uses).
Needs ffmpeg and numpy.
"""
import pathlib
import re
import subprocess
import sys
import wave

import numpy as np

RATE = 48000
BEAT = 0.38207
# 12 ms before the downbeat, so the first consonant is whole and frame 0 is on the beat.
DOWNBEAT = 83.969
START = DOWNBEAT - 0.012
# The song comes up over half a second (owner), not in at full level on the first frame.
FADE_IN = 0.5
# Beat 43 of the excerpt is the bar's last hit; the next line's pickup comes half a beat later. Cut between them.
CUT = DOWNBEAT + 43.5 * BEAT - 0.035
TAIL = 1.17
# What the tail is made from, and how loud it starts, as a share of the level the music stopped at.
THROW = 0.55
WET = 0.5
# Integrated loudness to aim for, and the ceiling its peaks must stay under (dB).
TARGET = -14.5
CEILING = -1.5

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'music' / 'track.wav'


def decode(path):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-vn', '-f', 'f32le', '-ac', '2', '-ar', str(RATE), '-'],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def one_pole(x, hz):
    """A one-pole low-pass, per channel."""
    k = 1 - np.exp(-2 * np.pi * hz / RATE)
    out = np.empty_like(x)
    acc = np.zeros(x.shape[1])
    for i in range(len(x)):
        acc += k * (x[i] - acc)
        out[i] = acc
    return out


def impulse():
    """A room that is not a room: two seconds of noise dying away, with its lows and its fizz taken off."""
    rng = np.random.default_rng(7)
    n = int(2.0 * RATE)
    noise = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / (0.33 * RATE))[:, None]
    band = one_pole(noise, 5000) - one_pole(noise, 250)
    return band / np.sqrt((band ** 2).sum(axis=0))


def write(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes((np.clip(samples, -1, 1) * 32767).astype('<i2').tobytes())


def loudness(path):
    """Integrated loudness (LUFS) and sample peak (dB) as ffmpeg's EBU R128 meter reads them."""
    log = subprocess.run(
        ['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'ebur128=peak=sample', '-f', 'null', '-'],
        capture_output=True, text=True,
    ).stderr
    summary = log[log.rindex('Summary:'):]
    return float(re.search(r'I:\s+(-?[\d.]+) LUFS', summary).group(1)), float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', summary).group(1))


def main():
    song = decode(sys.argv[1])
    dry = song[int(START * RATE):int(CUT * RATE)].copy()
    ramp = lambda n: np.linspace(0, 1, n)[:, None]
    dry[:int(FADE_IN * RATE)] *= ramp(int(FADE_IN * RATE))

    # The tail: the last half second, fading in, through the impulse; it is already swelling under the dry signal
    # when that stops.
    throw = dry[-int(THROW * RATE):] * ramp(int(THROW * RATE)) ** 2
    ir = impulse()
    size = len(throw) + len(ir) - 1
    wet = np.stack([np.fft.irfft(np.fft.rfft(throw[:, c], size) * np.fft.rfft(ir[:, c], size), size) for c in (0, 1)], axis=1)

    # Set the tail's level against the music it follows: measured over its first 150 ms after the cut.
    rms = lambda x: np.sqrt((x ** 2).mean())
    wet *= WET * rms(dry[-int(0.5 * RATE):]) / rms(wet[len(throw):len(throw) + int(0.15 * RATE)])

    fade = int(0.03 * RATE)
    dry[-fade:] *= ramp(fade)[::-1]
    out = np.zeros((len(dry) + int(TAIL * RATE), 2))
    out[:len(dry)] = dry
    at = len(dry) - len(throw)
    room = min(len(wet), len(out) - at)
    out[at:at + room] += wet[:room]
    out[-int(0.5 * RATE):] *= ramp(int(0.5 * RATE))[::-1]

    write(OUT, out / max(1.0, np.abs(out).max()))
    level, peak = loudness(OUT)
    gain = min(TARGET - level, CEILING - peak)
    write(OUT, out / max(1.0, np.abs(out).max()) * 10 ** (gain / 20))
    level, peak = loudness(OUT)
    print(f'{OUT}: {len(out) / RATE:.2f} s (music to {len(dry) / RATE:.2f} s, then the tail), {level:.1f} LUFS, peak {peak:.1f} dB')


if __name__ == '__main__':
    main()
