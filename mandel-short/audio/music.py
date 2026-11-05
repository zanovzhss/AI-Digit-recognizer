# Original score for "The Man Who Won the Lottery 14 Times" (composed + synthesized here with the template's
# instruments, 120 bpm, sections cut to the story beats in timeline.py):
#   A hook (0-3.8)        bright Bb fanfare: tuba oom-pah, horns, glock, snare; cuts dead after "lucky" (one pizz)
#   B Bucharest (3.8-9.8) sneaky D minor: pizzicato bass walking, vibes, brushes
#   C the idea (9.8-17.5) clever F major: music-box arpeggios over plucks; a lift on "prize", a giggle on "crazy"
#   D friends (17.5-21.2) building march (pizz + glock + snare), a full hit on "win"
#   E Melbourne (21.2-25.4) bouncy oom-pah, a horn stab on each "again" and on "Twelve"
#   F Virginia 1992 (25.4-34.6) tense G minor: low tuba ostinato, snare ticks, timpani; a stab on "$27 million"
#   G the operation (34.6-41.3) driving full march (brass, glock, snare)
#   H three days (41.3-44.6) ticking pizz + snare roll building, stops dead on "Doesn't matter"
#   I the winning ticket (44.6-47.4) glock + music box sparkle, major
#   J new rules (47.4-51.5) pompous low brass stabs
#   K the island (51.5-end) laid-back plucks + vibes, final Bb chord on "island", ringing out
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5
F = I.m2f
R = rng(1992)
_r = lambda: rng(int(R.integers(1 << 30)))
w = T.W

SECTIONS = [("A hook", 0.0, 3.8), ("B Bucharest", 3.8, 9.8), ("C the idea", 9.8, 17.5), ("D friends", 17.5, 21.2), ("E Melbourne", 21.2, 25.4),
            ("F Virginia 1992", 25.4, 34.6), ("G the operation", 34.6, 41.3), ("H three days", 41.3, 44.6), ("I the winning ticket", 44.6, 47.4),
            ("J new rules", 47.4, 51.5), ("K the island", 51.5, T.DUR)]


def bar(t0, b, beat=0.0):
    return t0 + b * 4 * Q + beat * Q


class Band:
    def __init__(self):
        self.tr, self.send = {}, {}

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        if t >= T.DUR:
            return
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N)); self.send[name] = send
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


CH = {"Bb": dict(oom=[34, 41], pah=[58, 62, 65]), "F": dict(oom=[41, 36], pah=[57, 60, 65]), "F7": dict(oom=[41, 36], pah=[57, 63, 65]),
      "Eb": dict(oom=[39, 46], pah=[55, 58, 63]), "Dm": dict(oom=[38, 45], pah=[57, 62, 65]), "A7": dict(oom=[33, 40], pah=[55, 61, 64]),
      "Gm": dict(oom=[43, 38], pah=[58, 62, 67]), "C7": dict(oom=[36, 43], pah=[55, 58, 64]), "D7": dict(oom=[38, 45], pah=[54, 57, 60])}


def oompah(b, t, chords, pah="horn", g=1.0, tuba=True):
    for beat, c in enumerate(chords):
        tb = t + beat * Q
        if tuba:
            b.add("tuba", I.brass(F(CH[c]["oom"][beat % 2]), 0.26, 0.6, _r(), "tuba"), tb, -0.1, g=g, send=0.1)
        if pah == "horn":
            for k, m in enumerate(CH[c]["pah"]):
                b.add("pah", I.brass(F(m), 0.13, 0.32, _r(), "horn", scoop=-12), tb + Q / 2 + 0.004 * k, 0.3 - 0.12 * k, g=g, send=0.18)
        elif pah == "pluck":
            b.add("pluck", I.pluck(F(CH[c]["pah"][1] + 12), 0.45, _r(), dur=0.4, bright=0.45), tb + Q / 2, 0.25, g=g, send=0.2)


def line(b, t, notes, inst="glock", shift=0, g=1.0, p=0.15):
    for (beat, d, m) in notes:
        tb = t + beat * Q
        if inst == "glock":
            b.add("glock", I.glock(F(m + shift), 0.6 * R.uniform(0.92, 1.05), _r()), tb, p, g=g, send=0.22)
        elif inst == "horn":
            b.add("lead", I.brass(F(m + shift), min(d * Q * 0.85, 0.9), 0.55, _r(), "horn", scoop=-15), tb, p, g=g, send=0.2)
        elif inst == "stacc":
            b.add("lead", I.brass(F(m + shift), min(d * Q * 0.45, 0.22), 0.5, _r(), "soft", scoop=-10), tb, p, g=g, send=0.2)
        elif inst == "vibes":
            b.add("vibes", I.vibes(F(m + shift), 0.5 * R.uniform(0.92, 1.05), _r(), dur=1.6, damp=d * Q + 0.35), tb, p, g=g, send=0.26)
        elif inst == "box":
            b.add("musicbox", I.musicbox(F(m + shift), 0.5 * R.uniform(0.9, 1.05), _r()), tb, p, g=g, send=0.26)
        elif inst == "pluck":
            b.add("pluck", I.pluck(F(m + shift), 0.55, _r(), dur=0.5, bright=0.5), tb, p, g=g, send=0.2)


SN = [0.55, 0, 0.3, 0, 0.75, 0, 0.3, 0.3, 0.55, 0, 0.3, 0, 0.75, 0, 0.35, 0.4]


def snare_bar(b, t, pat=SN, g=1.0):
    for s, v in enumerate(pat):
        if v:
            b.add("snare", I.snare(v * 0.5, _r()), t + s * Q / 4, 0.05, g=g, send=0.13)


def stab(b, t, notes, g=1.0, tuba=None):
    for k, m in enumerate(notes):
        b.add("pah", I.brass(F(m), 0.3, 0.65, _r(), "stab"), t + 0.004 * k, 0.25 - 0.12 * k, g=g, send=0.18)
    if tuba:
        b.add("tuba", I.brass(F(tuba), 0.32, 0.65, _r(), "tuba"), t, -0.1, g=g, send=0.1)


def build():
    b = Band()
    # ---- A hook: fanfare (Bb), out on "lucky"
    t0 = 0.0
    for i, ch in enumerate([["Bb"] * 4, ["F", "F", "Bb", "Bb"]]):
        oompah(b, bar(t0, i), ch)
        snare_bar(b, bar(t0, i), g=0.8)
    line(b, t0, [(0, 1, 70), (1, 0.5, 74), (1.5, 0.5, 77), (2, 1, 82), (3, 1, 77), (4, 1, 79), (5, 1, 77), (6, 1, 74), (7, 0.5, 70)], "glock")
    line(b, t0, [(0, 2, 70), (2, 2, 74), (4, 2, 77), (6, 1, 74)], "horn", -12, g=0.7, p=-0.2)
    b.add("cymbal", I.cymbal(0.5, _r(), dur=1.8, bright=0.9), 0.0, 0.2, g=0.7, send=0.16)
    lucky = w["lucky"]
    b.add("pluck", I.pluck(F(46), 0.6, _r(), dur=0.9, bright=0.3), lucky + 0.32, -0.1, send=0.2)   # the deadpan single pizz
    # ---- B Bucharest: sneaky D minor pizzicato walk, vibes, brushes (3.8 - 9.8, 3 bars)
    t0 = 3.85
    walk = [38, 41, 45, 41, 38, 40, 41, 43, 45, 44, 43, 40]
    for k, m in enumerate(walk):
        b.add("pluck", I.pluck(F(m + 12), 0.6, _r(), dur=0.45, bright=0.35), t0 + k * Q, -0.15, send=0.2)
        b.add("brush", I.brush(0.3, _r(), swish=k % 2 == 1), t0 + k * Q, 0.1, send=0.1)
    line(b, t0, [(1, 2, 62), (4, 2, 65), (7, 1, 64), (9, 2, 61)], "vibes", 12, g=0.8)
    b.add("pad", I.pad([F(m) for m in [50, 57, 62]], 6.0, 0.35, _r(), att=0.6, rel=0.8, warm=800), t0, 0.0, send=0.25)
    # ---- C the idea: F major music-box arpeggios over plucks (9.8 - 17.5, ~4 bars), a lift on "prize"
    t0 = 9.85
    for i, ch in enumerate(["F", "C7", "Dm", "Bb"]):
        oompah(b, bar(t0, i), [ch] * 4, pah="pluck", g=0.75, tuba=False)
        b.add("pluck", I.pluck(F(CH[ch]["oom"][0] + 12), 0.55, _r(), dur=0.6, bright=0.4), bar(t0, i), -0.15, send=0.2)
        arp = [CH[ch]["pah"][k % 3] + 12 + 12 * (k // 3 % 2) for k in range(8)]
        line(b, bar(t0, i), [(k * 0.5, 0.5, m) for k, m in enumerate(arp)], "box")
    stab(b, w["prize"] - 0.02, [58, 62, 65, 70], g=0.7, tuba=34)
    t1 = bar(t0, 4)                                              # "everyone says it's crazy": a cheeky giggle
    line(b, t1, [(0, 0.5, 72), (0.5, 0.5, 71), (1, 0.5, 72), (1.5, 0.5, 74), (2, 1, 76), (3, 0.5, 79), (3.5, 0.5, 76)], "stacc", g=0.9)
    b.add("pluck", I.pluck(F(53), 0.6, _r(), dur=0.6, bright=0.4), t1, -0.15, send=0.2)
    b.add("pluck", I.pluck(F(48), 0.6, _r(), dur=0.6, bright=0.4), t1 + 1.0, -0.15, send=0.2)
    # ---- D friends: building march, the hit on "win"
    t0 = 17.55
    for i, ch in enumerate([["F"] * 4, ["C7"] * 4]):
        oompah(b, bar(t0, i), ch, pah="pluck", g=0.85)
        line(b, bar(t0, i), [(0, 1, 72), (1, 0.5, 69), (1.5, 0.5, 70), (2, 1, 72), (3, 1, 77)] if i == 0 else [(0, 1, 76), (1, 0.5, 74), (1.5, 0.5, 72), (2, 2, 70)], "glock")
        snare_bar(b, bar(t0, i), g=0.6 + 0.2 * i)
    for (tr_, v) in I.snare_roll(0.0, 0.5, 0.3, 0.8, _r()):
        b.add("snare", I.snare(v * 0.6, _r(), dur=0.12, buzz=True), w["win"] - 0.5 + tr_, 0.05, send=0.13)
    stab(b, w["win"], [53, 57, 60, 65, 69], g=0.9, tuba=41)
    b.add("cymbal", I.cymbal(0.55, _r(), dur=1.6, bright=0.9), w["win"], 0.2, g=0.7, send=0.16)
    b.add("glock", I.glock(F(89), 0.7, _r()), w["win"], 0.15, send=0.22)
    # ---- E Melbourne: bouncy oom-pah (Bb), stabs on each "again" and "Twelve"
    t0 = 21.25
    for i, ch in enumerate([["Bb", "Bb", "F", "F"], ["Bb", "Bb", "Eb", "F"]]):
        oompah(b, bar(t0, i), ch, g=0.85)
        line(b, bar(t0, i), [(0, 0.5, 70), (0.5, 0.5, 74), (1, 0.5, 77), (1.5, 0.5, 74), (2, 1, 72), (3, 1, 69)] if i == 0 else [(0, 0.5, 70), (0.5, 0.5, 74), (1, 0.5, 77), (1.5, 0.5, 82), (2, 2, 79)], "glock", g=0.9)
    for s in (w["again"], w["again2"], w["twelve"]):
        stab(b, s, [58, 62, 65], g=0.7, tuba=34)
    b.add("cymbal", I.cymbal(0.4, _r(), dur=1.4, bright=0.8), w["twelve"], 0.2, g=0.6, send=0.16)
    # ---- F Virginia 1992: tense G minor ostinato, snare ticks, timpani; a stab on "$27 million"
    t0 = 25.45
    ost = [31, 38, 43, 38, 31, 38, 42, 38]
    for i in range(4):
        for k, m in enumerate(ost):
            b.add("tuba", I.brass(F(m), 0.2, 0.55, _r(), "tuba"), bar(t0, i) + k * Q / 2, -0.1, g=0.85, send=0.1)
        for s in range(8):
            b.add("snare", I.snare(0.18, _r(), dur=0.08), bar(t0, i) + s * Q / 2 + Q / 4, 0.05, g=0.5, send=0.1)
        b.add("pad", I.pad([F(m) for m in ([55, 58, 62] if i % 2 == 0 else [54, 57, 62])], 2.0, 0.3, _r(), att=0.3, rel=0.5, warm=900), bar(t0, i), 0.0, send=0.25)
    b.add("timp", I.timpani(F(43), 0.8, _r()), w["twentyseven"], -0.1, send=0.15)
    stab(b, w["twentyseven"], [55, 58, 62, 67], g=0.85, tuba=31)
    b.add("cymbal", I.cymbal(0.5, _r(), dur=1.6, bright=0.8), w["twentyseven"], 0.2, g=0.6, send=0.16)
    line(b, bar(t0, 2.5), [(0, 1, 67), (1, 1, 70), (2, 1, 74), (3, 1, 79)], "vibes", g=0.7)
    # ---- G the operation: driving full march (Bb), from "He prints" to the end of the couriers
    t0 = 34.6
    for i, ch in enumerate([["Bb"] * 4, ["F"] * 4, ["Gm", "Gm", "Eb", "Eb"], ["F7"] * 4]):
        oompah(b, bar(t0, i), ch)
        line(b, bar(t0, i), [[(0, 1, 70), (1, 0.5, 74), (1.5, 0.5, 77), (2, 1, 82), (3, 1, 77)], [(0, 1, 79), (1, 0.5, 77), (1.5, 0.5, 76), (2, 2, 72)],
                             [(0, 1, 74), (1, 0.5, 77), (1.5, 0.5, 79), (2, 1, 82), (3, 1, 79)], [(0, 1, 77), (1, 1, 76), (2, 1, 74), (3, 1, 72)]][i], "glock", 12, g=0.85)
        line(b, bar(t0, i), [[(0, 2, 70), (2, 2, 74)], [(0, 2, 72), (2, 2, 69)], [(0, 2, 70), (2, 2, 67)], [(0, 2, 69), (2, 2, 72)]][i], "horn", -12, g=0.7, p=-0.2)
        snare_bar(b, bar(t0, i))
    b.add("cymbal", I.cymbal(0.45, _r(), dur=1.6, bright=0.9), t0, 0.2, g=0.6, send=0.16)
    # ---- H three days: ticking pizz + snare roll building, stops dead on "Doesn't matter"
    t0 = 41.3
    stop = w["doesnt"] - 0.02
    k = 0
    while t0 + k * Q / 2 < stop - 0.05:
        b.add("pluck", I.pluck(F([67, 70, 67, 72][k % 4]), 0.5 + 0.02 * k, _r(), dur=0.25, bright=0.5), t0 + k * Q / 2, 0.2, send=0.2)
        k += 1
    for (tr_, v) in I.snare_roll(0.0, stop - t0 - 0.05, 0.1, 0.8, _r()):
        b.add("snare", I.snare(v * 0.6, _r(), dur=0.12, buzz=True), t0 + tr_, 0.05, send=0.13)
    b.add("pad", I.pad([F(m) for m in [55, 58, 62, 67]], stop - t0, 0.3, _r(), att=0.8, rel=0.05, warm=1100), t0, 0.0, send=0.2)
    # ---- I the winning ticket: glock + music box sparkle (Bb major)
    t0 = w["the2"] - 0.05
    b.add("pad", I.pad([F(m) for m in [58, 62, 65, 70]], 2.6, 0.4, _r(), att=0.3, rel=0.8, warm=1400), t0, 0.0, send=0.3)
    line(b, t0, [(0, 0.5, 82), (0.5, 0.5, 86), (1, 0.5, 89), (1.5, 0.5, 94), (2, 1, 91), (3, 1, 89)], "glock")
    line(b, t0, [(k * 0.5, 0.5, m) for k, m in enumerate([70, 74, 77, 82, 77, 74, 70, 74])], "box", 12, g=0.8)
    # ---- J new rules: pompous low brass stabs (Eb -> D7), on "changed", "rules", "nobody", "ever", "again"
    for s, ch in ((w["so2"], [39, 46, 51]), (w["changed"], [39, 46, 51, 55]), (w["rules"], [38, 45, 50, 54]), (w["so3"], [39, 46, 51]), (w["ever"], [38, 45, 50, 54]), (w["again3"], [34, 41, 46, 50])):
        stab(b, s, [m + 12 for m in ch], g=0.75, tuba=ch[0])
    b.add("timp", I.timpani(F(38), 0.7, _r()), w["ever"], -0.1, send=0.15)
    # ---- K the island: laid-back plucks + vibes, final Bb chord on "island"
    t0 = 51.55
    for k, m in enumerate([46, 53, 58, 53, 51, 55, 58, 55]):
        b.add("pluck", I.pluck(F(m + 12), 0.5, _r(), dur=0.7, bright=0.35), t0 + k * Q * 0.5 * 1.2, -0.1, send=0.25)
    line(b, t0, [(0.5, 1, 74), (1.5, 1, 77), (2.5, 2, 79)], "vibes", 0, g=0.8)
    fin = w["island"]
    for k, m in enumerate([58, 62, 65, 70, 74]):
        b.add("vibes", I.vibes(F(m), 0.55, _r(), dur=2.0, damp=1.6), fin + 0.01 * k, 0.2 - 0.1 * k, send=0.3)
    b.add("pluck", I.pluck(F(46), 0.6, _r(), dur=1.4, bright=0.3), fin, -0.1, send=0.25)
    return b


TARGET = {"glock": -5.0, "tuba": -3.0, "pah": -7.0, "snare": -8.0, "pluck": -4.5, "brush": -13.0, "vibes": -3.5, "pad": -8.0,
          "musicbox": -4.0, "cymbal": -12.0, "lead": -4.5, "timp": -7.0}


def render(b, ref=-20.0):
    hall = make_ir(1.2, 7, pre=0.018, hf=1.4)
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
