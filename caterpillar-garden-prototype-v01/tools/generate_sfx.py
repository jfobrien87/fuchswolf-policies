"""Render five replaceable, original placeholder effects to local PCM WAV files."""
from pathlib import Path
import math
import struct
import wave

ROOT = Path(__file__).resolve().parents[1] / 'assets' / 'audio'
ROOT.mkdir(parents=True, exist_ok=True)
RATE = 44100

def render(name, duration, notes, peak):
    samples = []
    for i in range(round(duration * RATE)):
        time = i / RATE
        value = 0
        for start, frequency, length, weight in notes:
            t = time - start
            if 0 <= t < length:
                attack = min(1, t / .009)
                release = min(1, (length-t) / .045)
                envelope = attack * release * math.exp(-5*t/length)
                tone = math.sin(2*math.pi*frequency*t) + .16*math.sin(2*math.pi*frequency*2*t)
                value += weight * envelope * tone
        samples.append(value)
    scale = peak / max(abs(v) for v in samples)
    with wave.open(str(ROOT / f'{name}.wav'), 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(v*scale*32767)) for v in samples))

render('pickup', .16, [(0, 784, .16, 1)], .30)
render('return', .20, [(0, 294, .20, 1)], .24)
render('correct', .40, [(0, 659.25, .36, 1), (.065, 987.77, .33, .6)], .48)
render('complete', .76, [(0, 523.25, .38, .8), (.13, 659.25, .40, .8), (.26, 783.99, .50, 1)], .48)
render('door', .58, [(0, 349.23, .53, .7), (.055, 523.25, .525, .55), (.12, 698.46, .46, .25)], .34)
print('Rendered five short, gentle WAV effects.')
