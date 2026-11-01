# Original light march bed for "The Warm Bucket" (F major, 120 bpm, composed + synthesized here with the template's
# instruments). The beat grid is offset by 0.133 s so bar 4's downbeat lands exactly on "save" (frame 184, the nod and
# the camera kick). Bar 1 street: tuba oom-pah + glockenspiel tune + light snare | bar 2 cellar: pizzicato bass + vibes,
# brushes | bar 3 ice: music-box sparkle over a held pad (Dm - Bb - C7) | bar 4: tonic hit on "save", rings out to 7.0 s.
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5
T0 = round(T.fr(T.NOD) - 12 * Q, 4)      # bar 1 downbeat (0.133 s); bar b starts at T0 + 4 Q (b - 1)
bar = lambda b, beat=0.0: T0 + (b - 1) * 4 * Q + beat * Q
F = I.m2f
R = rng(1888)
_r = lambda: rng(int(R.integers(1 << 30)))

# sections (name, start, end) for the mix report
SECTIONS = [("street", 0.0, T.CUT_CELLAR), ("cellar", T.CUT_CELLAR, T.fr(120)), ("ice", T.fr(120), T.fr(175)), ("end", T.fr(175), T.DUR)]


class Band:
    def __init__(self):
        self.tr, self.send = {}, {}

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N)); self.send[name] = send
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


# chords: tuba roots / after-beat voicings (midi)
CH = {"F": dict(oom=[41, 36], pah=[57, 60, 65]), "C7": dict(oom=[36, 43], pah=[55, 58, 64]), "Bb": dict(oom=[34, 41], pah=[58, 62, 65]),
      "Dm": dict(oom=[38, 45], pah=[57, 62, 65])}


def build():
    b = Band()
    # ---- bar 1 (street): oom-pah F F C7 C7, glock tune, light snare
    for beat, c in enumerate(["F", "F", "C7", "C7"]):
        t = bar(1, beat)
        b.add("tuba", I.brass(F(CH[c]["oom"][beat % 2]), 0.28, 0.62, _r(), "tuba"), t, -0.1, send=0.1)
        for k, m in enumerate(CH[c]["pah"]):
            b.add("pah", I.brass(F(m), 0.14, 0.34, _r(), "horn", scoop=-12), t + Q / 2 + 0.004 * k, 0.3 - 0.12 * k, send=0.18)
    for (beat, d, m) in [(0, 1, 72), (1, 0.5, 69), (1.5, 0.5, 70), (2, 1, 72), (3, 0.5, 67), (3.5, 0.5, 64)]:
        b.add("glock", I.glock(F(m), 0.6 * R.uniform(0.92, 1.05), _r()), bar(1, beat), 0.15, send=0.22)
    for s, v in enumerate([0.55, 0, 0.3, 0, 0.75, 0, 0.3, 0.3, 0.55, 0, 0.3, 0, 0.75, 0, 0.35, 0.4]):
        if v:
            b.add("snare", I.snare(v * 0.5, _r()), bar(1, s / 4), 0.05, send=0.13)
    # pickup before bar 1 is too early (voice starts at 0.14): the tune starts on the downbeat
    # ---- bar 2 (cellar): pizzicato bass + vibes, brushes; F F Bb Bb
    for beat, c in enumerate(["F", "F", "Bb", "Bb"]):
        b.add("pluck", I.pluck(F(CH[c]["oom"][beat % 2] + 12), 0.6, _r(), dur=0.6, bright=0.4), bar(2, beat), -0.15, send=0.2)
        b.add("brush", I.brush(0.4, _r(), swish=beat % 2 == 1), bar(2, beat), 0.1, send=0.1)
    for (beat, d, m) in [(0, 1, 65), (1, 1, 69), (2, 1, 70), (3, 1, 74)]:
        b.add("vibes", I.vibes(F(m), 0.5 * R.uniform(0.92, 1.05), _r(), dur=1.6, damp=d + 0.35), bar(2, beat), 0.2, send=0.26)
    # ---- bar 3 (ice): pad Dm -> Bb -> C7, music-box sparkle (crystals), pizz on the changes
    for beat, c, d in [(0, "Dm", 2), (2, "Bb", 1), (3, "C7", 1)]:
        b.add("pad", I.pad([F(m) for m in CH[c]["pah"]], d * Q, 0.45, _r(), att=0.25, rel=0.4, warm=1100), bar(3, beat), 0.0, send=0.25)
        b.add("pluck", I.pluck(F(CH[c]["oom"][0] + 12), 0.55, _r(), dur=0.6, bright=0.35), bar(3, beat), -0.15, send=0.2)
    for (beat, m) in [(0, 74), (0.5, 77), (1, 81), (1.5, 77), (2, 77), (2.5, 74), (3, 76), (3.5, 79)]:
        b.add("musicbox", I.musicbox(F(m + 12), 0.5 * R.uniform(0.9, 1.05), _r()), bar(3, beat), 0.25 - 0.5 * (beat % 1), send=0.26)
    # ---- bar 4: tonic hit on "save" (tuba + horns + glock + soft cymbal), rings to the end
    t = bar(4)
    b.add("tuba", I.brass(F(41), 0.6, 0.7, _r(), "tuba"), t, -0.1, send=0.1, g=0.55)
    for k, m in enumerate([57, 60, 65, 69]):
        b.add("pah", I.brass(F(m), 0.5, 0.42, _r(), "horn", scoop=-10), t + 0.004 * k, 0.3 - 0.15 * k, g=0.5, send=0.18)
    b.add("glock", I.glock(F(77), 0.7, _r()), t, 0.15, send=0.22)
    b.add("glock", I.glock(F(84), 0.45, _r()), t + 0.25, 0.25, send=0.22)
    b.add("cymbal", I.cymbal(0.35, _r(), dur=1.4, bright=0.8), t, 0.2, g=0.6, send=0.16)
    b.add("snare", I.snare(0.5, _r()), t, 0.05, g=0.6, send=0.13)
    return b


TARGET = {"glock": -5.0, "tuba": -2.5, "pah": -7.5, "snare": -6.5, "pluck": -4.0, "brush": -13.0, "vibes": -3.0, "pad": -6.0,
          "musicbox": -3.0, "cymbal": -12.0}


def render(b, ref=-20.0):
    hall = make_ir(1.3, 7, pre=0.018, hf=1.4)
    dry, wet = np.zeros((2, N)), np.zeros((2, N))
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        g = dbg(ref + TARGET.get(k, -6) - integrated(x))
        x = x * g
        b.tr[k] = x
        dry += x
        wet += b.send[k] * x
    out = hp(dry + 0.7 * convolve_st(wet.mean(0), hall), 30, 2)
    return out, {}
