# Original light march bed for "The Man Who Sold Ice to the Tropics" (F major, 120 bpm, composed + synthesized here with
# the template's instruments). The beat grid starts at 0.35 s so bar 28's downbeat (the final tonic hit) lands on
# "laughed" (54.35 s). A (bars 1-5) hook + Boston: tuba oom-pah, glockenspiel tune, light snare | B (6-11) the joke and
# the melt: D minor, sneaky staccato horn, pizz after-beats | C (12) "tries again. And again.": two horn stabs | D (13-14)
# prison: pad + sparse vibes | E (15-17) the idea: music-box sparkle, major | F (18-21) towel + sawdust: pizz march,
# brushes, glock | G (22-24) the voyage: full march | H (25-27) Calcutta: horns take the tune, snare roll | bar 28 hit.
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5
T0 = 0.35
bar = lambda b, beat=0.0: T0 + (b - 1) * 4 * Q + beat * Q
F = I.m2f
R = rng(1833)
_r = lambda: rng(int(R.integers(1 << 30)))

SECTIONS = [("A hook+Boston", 0.0, bar(6)), ("B joke+melt", bar(6), bar(12)), ("C again", bar(12), bar(13)), ("D prison", bar(13), bar(15)),
            ("E idea", bar(15), bar(18)), ("F towel+sawdust", bar(18), bar(22)), ("G voyage", bar(22), bar(25)), ("H Calcutta", bar(25), T.DUR)]


class Band:
    def __init__(self):
        self.tr, self.send = {}, {}

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N)); self.send[name] = send
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


CH = {"F": dict(oom=[41, 36], pah=[57, 60, 65]), "C7": dict(oom=[36, 43], pah=[55, 58, 64]), "Bb": dict(oom=[34, 41], pah=[58, 62, 65]),
      "Dm": dict(oom=[38, 45], pah=[57, 62, 65]), "A7": dict(oom=[33, 40], pah=[55, 61, 64]), "Gm": dict(oom=[43, 38], pah=[58, 62, 67])}


def oompah(b, n, chords, pah="horn", g=1.0, tuba=True):
    for beat, c in enumerate(chords):
        t = bar(n, beat)
        if tuba:
            b.add("tuba", I.brass(F(CH[c]["oom"][beat % 2]), 0.26, 0.6, _r(), "tuba"), t, -0.1, g=g, send=0.1)
        for k, m in enumerate(CH[c]["pah"]):
            if pah == "horn":
                b.add("pah", I.brass(F(m), 0.13, 0.32, _r(), "horn", scoop=-12), t + Q / 2 + 0.004 * k, 0.3 - 0.12 * k, g=g, send=0.18)
        if pah == "pluck":
            b.add("pluck", I.pluck(F(CH[c]["pah"][1] + 12), 0.45, _r(), dur=0.4, bright=0.45), t + Q / 2, 0.25, g=g, send=0.2)


def tune(b, n, notes, inst="glock", shift=0, g=1.0, p=0.15):
    for (beat, d, m) in notes:
        t = bar(n, beat)
        if inst == "glock":
            b.add("glock", I.glock(F(m + shift), 0.6 * R.uniform(0.92, 1.05), _r()), t, p, g=g, send=0.22)
        elif inst == "horn":
            b.add("lead", I.brass(F(m + shift), min(d * Q * 0.85, 0.9), 0.55, _r(), "horn", scoop=-15), t, p, g=g, send=0.2)
        elif inst == "stacc":
            b.add("lead", I.brass(F(m + shift), min(d * Q * 0.45, 0.22), 0.5, _r(), "soft", scoop=-10), t, p, g=g, send=0.2)
        elif inst == "vibes":
            b.add("vibes", I.vibes(F(m + shift), 0.5 * R.uniform(0.92, 1.05), _r(), dur=1.6, damp=d * Q + 0.35), t, p, g=g, send=0.26)
        elif inst == "musicbox":
            b.add("musicbox", I.musicbox(F(m + shift), 0.5 * R.uniform(0.9, 1.05), _r()), t, p, g=g, send=0.26)


def snare_bar(b, n, pat, g=1.0):
    for s, v in enumerate(pat):
        if v:
            b.add("snare", I.snare(v * 0.5, _r()), bar(n, s / 4), 0.05, g=g, send=0.13)


SN = [0.55, 0, 0.3, 0, 0.75, 0, 0.3, 0.3, 0.55, 0, 0.3, 0, 0.75, 0, 0.35, 0.4]
A_TUNE = [
    [(0, 1, 72), (1, 0.5, 69), (1.5, 0.5, 70), (2, 1, 72), (3, 1, 77)],
    [(0, 1, 76), (1, 0.5, 74), (1.5, 0.5, 72), (2, 2, 70)],
    [(0, 1, 69), (1, 0.5, 72), (1.5, 0.5, 77), (2, 1, 76), (3, 1, 74)],
    [(0, 1, 74), (1, 1, 72), (2, 1, 70), (3, 1, 67)],
    [(0, 2, 65), (2, 0.5, 72), (2.5, 0.5, 74), (3, 1, 76)],
]
B_TUNE = [
    [(0, 0.5, 62), (0.5, 0.5, 65), (1, 0.5, 69), (2, 0.5, 67), (2.5, 0.5, 65), (3, 1, 64)],
    [(0, 0.5, 61), (0.5, 0.5, 64), (1, 0.5, 67), (2, 0.5, 69), (2.5, 0.5, 67), (3, 1, 64)],
    [(0, 0.5, 62), (0.5, 0.5, 65), (1, 0.5, 69), (2, 0.5, 67), (2.5, 0.5, 65), (3, 1, 64)],
    [(0, 1, 70), (1, 0.5, 69), (1.5, 0.5, 67), (2, 2, 65)],
    [(0, 0.5, 67), (0.5, 0.5, 70), (1, 0.5, 74), (2, 1, 72), (3, 1, 70)],
    [(0, 1, 69), (1, 1, 67), (2, 2, 64)],
]


def build():
    b = Band()
    # ---- A: bars 1-5
    for i, ch in enumerate([["F", "F", "F", "F"], ["C7", "C7", "C7", "C7"], ["F", "F", "F", "F"], ["Bb", "Bb", "C7", "C7"], ["F", "F", "C7", "C7"]]):
        oompah(b, 1 + i, ch, g=0.85 if i < 2 else 1.0)
        tune(b, 1 + i, A_TUNE[i])
        snare_bar(b, 1 + i, SN, g=0.7)
    # ---- B: bars 6-11 (D minor, sneaky)
    for i, c in enumerate(["Dm", "A7", "Dm", "Bb", "Gm", "C7"]):
        oompah(b, 6 + i, [c] * 4, pah="pluck", g=0.8)
        tune(b, 6 + i, B_TUNE[i], "stacc", p=-0.15)
        b.add("brush", I.brush(0.35, _r()), bar(6 + i, 0), 0.1, send=0.1)
        b.add("brush", I.brush(0.3, _r(), swish=True), bar(6 + i, 2), 0.1, send=0.1)
    # ---- C: bar 12 "tries again. And again." two stabs + a little roll
    for beat in (0.6, 3.25):
        for k, m in enumerate([53, 57, 60, 65]):
            b.add("pah", I.brass(F(m), 0.28, 0.6, _r(), "stab"), bar(12, beat) + 0.004 * k, 0.2 - 0.1 * k, send=0.18)
        b.add("tuba", I.brass(F(41), 0.3, 0.6, _r(), "tuba"), bar(12, beat), -0.1, send=0.1)
        b.add("snare", I.snare(0.5, _r()), bar(12, beat), 0.05, send=0.13)
    # ---- D: bars 13-14 prison (pad Dm, sparse vibes, slow pizz)
    for n, c in [(13, "Dm"), (14, "A7")]:
        b.add("pad", I.pad([F(m) for m in CH[c]["pah"]], 4 * Q, 0.4, _r(), att=0.4, rel=0.6, warm=900), bar(n), 0.0, send=0.25)
        for beat in (0, 2):
            b.add("pluck", I.pluck(F(CH[c]["oom"][0] + 12), 0.5, _r(), dur=0.8, bright=0.3), bar(n, beat), -0.15, send=0.2)
    tune(b, 13, [(0, 2, 62), (2, 2, 65)], "vibes"); tune(b, 14, [(0, 2, 64), (2, 2, 61)], "vibes")
    # ---- E: bars 15-17 the idea (major, music box)
    for n, cs in [(15, ["F", "F", "C7", "C7"]), (16, ["Bb", "Bb", "C7", "C7"]), (17, ["F", "F", "F", "F"])]:
        oompah(b, n, cs, pah="pluck", g=0.75, tuba=False)
        for beat in (0, 2):
            b.add("pluck", I.pluck(F(CH[cs[beat]]["oom"][0] + 12), 0.55, _r(), dur=0.6, bright=0.4), bar(n, beat), -0.15, send=0.2)
    tune(b, 15, [(0, 0.5, 72), (0.5, 0.5, 77), (1, 0.5, 81), (1.5, 0.5, 77), (2, 0.5, 79), (2.5, 0.5, 76), (3, 0.5, 72), (3.5, 0.5, 76)], "musicbox", 12)
    tune(b, 16, [(0, 0.5, 74), (0.5, 0.5, 77), (1, 0.5, 82), (1.5, 0.5, 77), (2, 0.5, 79), (2.5, 0.5, 76), (3, 0.5, 72), (3.5, 0.5, 79)], "musicbox", 12)
    tune(b, 17, [(0, 2, 77), (2, 0.5, 72), (2.5, 0.5, 74), (3, 1, 76)], "glock")
    # ---- F: bars 18-21 towel + sawdust (light march: pizz oom-pah, glock tune, brushes)
    for i, ch in enumerate([["F", "F", "F", "F"], ["C7", "C7", "C7", "C7"], ["F", "F", "F", "F"], ["Bb", "Bb", "C7", "C7"]]):
        oompah(b, 18 + i, ch, pah="pluck", g=0.8, tuba=True)
        tune(b, 18 + i, A_TUNE[i])
        for beat in range(4):
            b.add("brush", I.brush(0.35, _r(), swish=beat % 2 == 1), bar(18 + i, beat), 0.1, send=0.1)
    # ---- G: bars 22-24 the voyage (full march)
    b.add("cymbal", I.cymbal(0.4, _r(), dur=1.6, bright=0.8), bar(22), 0.2, g=0.6, send=0.16)
    for i, ch in enumerate([["F", "F", "F", "F"], ["Bb", "Bb", "Bb", "Bb"], ["C7", "C7", "C7", "C7"]]):
        oompah(b, 22 + i, ch)
        tune(b, 22 + i, A_TUNE[i], "glock", 12, g=0.9)
        tune(b, 22 + i, A_TUNE[i], "horn", -12, g=0.7, p=-0.2)
        snare_bar(b, 22 + i, SN)
    # ---- H: bars 25-27 Calcutta (horns take the tune), roll into the hit
    for i, ch in enumerate([["F", "F", "F", "F"], ["Bb", "Bb", "C7", "C7"], ["F", "F", "C7", "C7"]]):
        oompah(b, 25 + i, ch)
        tune(b, 25 + i, [A_TUNE[0], A_TUNE[2], A_TUNE[4]][i], "horn", 0, p=-0.15)
        tune(b, 25 + i, [A_TUNE[0], A_TUNE[2], A_TUNE[4]][i], "glock", 12, g=0.8)
        if i < 2:
            snare_bar(b, 25 + i, SN)
    for (tr_, v) in I.snare_roll(0.0, 2 * Q, 0.2, 0.7, _r()):
        b.add("snare", I.snare(v * 0.6, _r(), dur=0.12, buzz=True), bar(27, 2) + tr_, 0.05, send=0.13)
    # ---- bar 28: tonic hit on "laughed", rings to the end
    t = bar(28)
    b.add("tuba", I.brass(F(41), 0.6, 0.7, _r(), "tuba"), t, -0.1, send=0.1, g=0.6)
    for k, m in enumerate([57, 60, 65, 69]):
        b.add("pah", I.brass(F(m), 0.55, 0.45, _r(), "horn", scoop=-10), t + 0.004 * k, 0.3 - 0.15 * k, g=0.55, send=0.18)
    b.add("glock", I.glock(F(89), 0.7, _r()), t, 0.15, send=0.22)
    b.add("cymbal", I.cymbal(0.45, _r(), dur=1.4, bright=0.8), t, 0.2, g=0.6, send=0.16)
    b.add("snare", I.snare(0.55, _r()), t, 0.05, g=0.6, send=0.13)
    return b


TARGET = {"glock": -5.0, "tuba": -2.5, "pah": -7.5, "snare": -7.0, "pluck": -4.5, "brush": -13.0, "vibes": -3.0, "pad": -6.0,
          "musicbox": -3.0, "cymbal": -12.0, "lead": -4.0}


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
    out = hp(dry + 0.7 * convolve_st(wet.mean(0), hall)[:, :N], 30, 2)
    return out, {}
