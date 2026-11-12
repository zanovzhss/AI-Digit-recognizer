# Original score for "The Stone That Saved a Village" (composed + synthesized here with the template's instruments).
# Calm and wistful, respectful of a real disaster: koto-like plucks on a D "in"-style scale (D E F A Bb) over soft pads;
# tension builds from the earthquake (beat 8, 37.9 s) with a low drone, pulsing timpani and a tremolo cluster; it drops
# to near-silence on "stops" (49.1 s) and resolves into a warm D major chord on "still standing" (53.3 s).
#   A the stone (0-5.9)            golden: soft Dm(add9) pad, a slow pluck motif, a glock shimmer as the lens cranes up
#   B 1896 (5.9-13.3)              dark drone, low plucks, a soft timpani swell under the rising sea; near-silence on "survived"
#   C 1933 (13.3-17.8)             the motif again, quieter; single low hits on "1933" and "again"
#   D the carving (17.8-21.2)      warm pad, plucks between the chisel taps
#   E eighty years (21.2-28.4)     F major pentatonic arpeggios, glock, brushes: the town grows; a music-box wink on "view"
#   F forgotten stones (28.4-33.1) sparse music box, wistful
#   G eleven families (33.1-37.8)  warm and hopeful: pad + the motif in major
#   H 2011 (37.8-46.4)             tension: drone, timpani pulses, a semitone ostinato, rising tremolo pad
#   I the valley (46.4-49.1)       the peak: timpani roll and the cluster, cut dead on "stops"
#   J below the stone (49.1-51.9)  near-silence: one high held note
#   K still standing (51.9-end)    warm D major pad, a koto arpeggio and glock on "still standing", ringing to the end
import numpy as np
from dsp import SR, ns, rng, pan, place, fades, dbg, make_ir, convolve_st, integrated, lp, hp, tt
import instruments as I
import timeline as T

N = ns(T.DUR)
F = I.m2f
R = rng(2011)
_r = lambda: rng(int(R.integers(1 << 30)))
w = T.W

SECTIONS = [("A the stone", 0.0, 5.9), ("B 1896", 5.9, 13.3), ("C 1933", 13.3, 17.8), ("D the carving", 17.8, 21.2),
            ("E eighty years", 21.2, 28.4), ("F forgotten stones", 28.4, 33.1), ("G eleven families", 33.1, 37.8),
            ("H 2011", 37.8, 46.4), ("I the valley", 46.4, 49.1), ("J below the stone", 49.1, 51.9), ("K still standing", 51.9, T.DUR)]


class Band:
    def __init__(self):
        self.tr, self.send = {}, {}

    def add(self, name, x, t, p=0.0, g=1.0, send=0.18):
        if t >= T.DUR or t < -5:
            return
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N)); self.send[name] = send
        place(self.tr[name], pan(x, p) if np.ndim(x) == 1 else x, t, g)


def koto(b, t, m, vel=0.7, p=0.0, dur=1.6, g=1.0, bright=0.55):
    """a koto-like pluck: a bright plucked string plus a soft octave shimmer"""
    f = F(m)
    y = I.pluck(f, vel, _r(), dur, bright, 0.12)
    o = I.pluck(2 * f, vel, _r(), dur * 0.6, bright, 0.2)
    y[: len(o)] += 0.18 * o
    b.add("koto", y, t, p, g)


def pad(b, t, notes, dur, vel=0.5, att=0.8, rel=1.2, warm=900.0, name="pad", trem=None, g=1.0):
    b.add(name, I.pad([F(m) for m in notes], dur, vel, _r(), att=att, rel=rel, warm=warm, trem=trem), t, 0.0, g)


def build():
    b = Band()
    # ---------------- A the stone (golden): Dm(add9) pad, slow motif, glock as the lens cranes up
    pad(b, 0.0, [50, 57, 64, 65], 5.6, 0.5, att=1.2, rel=1.4)
    for t, m in [(0.35, 69), (1.25, 65), (1.9, 64), (2.6, 62), (3.5, 69), (4.1, 72), (4.6, 70), (5.2, 69)]:
        koto(b, t, m, 0.6, 0.2 * np.sin(t))
    for k, m in enumerate([81, 84, 86, 88]):
        b.add("glock", I.glock(F(m), 0.35, _r(), 2.2), w["do"] + 0.1 + k * 0.22, 0.3 - 0.2 * k)
    # ---------------- B 1896: drone, low plucks, the swell, near-silence on "survived"
    pad(b, 5.9, [38, 45, 50], 5.6, 0.55, att=1.5, rel=1.2, warm=500, name="drone")
    for t, m in [(6.5, 50), (7.15, 53), (7.75, 52), (8.5, 50), (9.3, 45), (9.75, 46)]:
        koto(b, t, m, 0.55, -0.2, 2.2, bright=0.35)
    roll_t = np.arange(7.6, 10.6, 1 / 14)
    for k, t in enumerate(roll_t):
        u = k / len(roll_t)
        b.add("timp", I.timpani(F(38), 0.15 + 0.6 * u * u, _r(), 0.6), t, 0.0, 0.5)
    b.add("timp", I.timpani(F(38), 0.9, _r(), 3.0), 10.6, 0.0)
    pad(b, w["survived"] - 0.2, [81], 2.2, 0.18, att=0.8, rel=1.2, warm=2000, name="air")
    # ---------------- C 1933: the motif again, quieter, low hits on "1933" and "again"
    pad(b, 13.2, [38, 45, 53], 4.2, 0.4, att=1.2, rel=1.0, warm=500, name="drone")
    for t, m in [(13.4, 57), (14.05, 53), (14.6, 52), (15.2, 50), (16.0, 45)]:
        koto(b, t, m, 0.45, 0.25, 2.0, bright=0.35)
    for t in (w["y1933"], w["again"]):
        b.add("timp", I.timpani(F(38), 0.7, _r(), 2.4), t - 0.02, 0.0)
    pad(b, w["four"] - 0.1, [76], 1.6, 0.16, att=0.6, rel=1.0, warm=2000, name="air")
    # ---------------- D the carving: warm pad, plucks between the chisel taps (taps every 14 frames from frame 533)
    pad(b, 17.75, [46, 53, 58, 62], 3.4, 0.45, att=0.9, rel=1.2)
    taps = [T.fr(533 + 3 + 14 * k) for k in range(4)]
    for k, t in enumerate(taps):
        koto(b, t + 0.23, [62, 65, 69, 70][k], 0.5, 0.15 * (k % 2 * 2 - 1), 1.4)
    koto(b, 19.5, 74, 0.5, 0.2, 1.8); koto(b, 20.3, 72, 0.45, -0.2, 1.8)
    # ---------------- E eighty years: F major pentatonic arpeggios, glock, brushes (the time-lapse)
    pad(b, 21.15, [41, 48, 57, 60], 7.2, 0.45, att=0.8, rel=1.2, warm=1100)
    arp = [65, 69, 72, 74, 77, 74, 72, 69]
    tq = 0.3
    for k in range(int((28.3 - 21.3) / tq)):
        t = 21.3 + k * tq
        koto(b, t, arp[k % 8] + (12 if 24.0 < t < 25.3 else 0) * 0, 0.4 + 0.15 * (k % 4 == 0), 0.3 * np.sin(k), 0.9, bright=0.6)
        if k % 2 == 0:
            b.add("brush", I.brush(0.35 + 0.2 * (k % 4 == 0), _r(), 0.25), t, 0.2)
    for t, m in [(w["towns"], 84), (w["water"], 86), (w["boats"], 89), (w["jobs"], 88)]:
        b.add("glock", I.glock(F(m), 0.4, _r(), 1.8), t, 0.3)
    for k, m in enumerate([93, 89, 86]):
        b.add("musicbox", I.musicbox(F(m), 0.45, _r(), 1.2), w["view"] + 0.08 + 0.1 * k, -0.3)
    # ---------------- F forgotten stones: sparse music box
    pad(b, 28.4, [50, 57, 65], 4.6, 0.35, att=1.0, rel=1.2, warm=700)
    for t, m in [(28.6, 74), (29.6, 72), (30.4, 69), (31.4, 74), (32.1, 77), (32.6, 76)]:
        b.add("musicbox", I.musicbox(F(m), 0.5, _r(), 1.8), t, 0.1)
    # ---------------- G eleven families: warm, hopeful (Bb - F - C - F)
    for t, ch, d in [(33.05, [46, 53, 58, 62], 1.3), (34.35, [41, 53, 57, 60], 1.3), (35.65, [48, 55, 60, 64], 1.1), (36.75, [41, 53, 57, 65], 1.3)]:
        pad(b, t, ch, d, 0.5, att=0.4, rel=0.9, warm=1000)
    for t, m in [(33.2, 69), (33.85, 72), (34.6, 74), (35.1, 72), (35.8, 77), (36.4, 76), (36.9, 74), (37.3, 72)]:
        koto(b, t, m, 0.55, 0.15, 1.6, bright=0.55)
    # ---------------- H 2011: tension from "Then, in 2011" (drone, timpani pulses, semitone ostinato, rising tremolo pad)
    pad(b, 37.8, [26, 33, 38], 8.8, 0.6, att=1.5, rel=0.3, warm=300, name="drone")
    t = 38.4
    k = 0
    while t < 46.3:
        u = (t - 38.4) / 8.0
        b.add("timp", I.timpani(F(38), 0.25 + 0.55 * u, _r(), 0.9), t, 0.0)
        t += 0.72 - 0.25 * u
        k += 1
    t = 39.5
    k = 0
    while t < 46.3:
        koto(b, t, [62, 63][k % 2], 0.32 + 0.2 * (t - 39.5) / 7, 0.25 * (k % 2 * 2 - 1), 0.6, bright=0.3)
        t += 0.36
        k += 1
    trem = lambda tt_: 0.7 + 0.3 * np.sin(2 * np.pi * 7.0 * tt_)
    pad(b, 41.0, [62, 63, 69, 70], 5.4, 0.5, att=4.0, rel=0.3, warm=1400, name="cluster", trem=trem)
    # ---------------- I the valley: the peak, cut dead on "stops"
    roll_t = np.arange(46.4, w["stops"] - 0.05, 1 / 16)
    for k, t in enumerate(roll_t):
        b.add("timp", I.timpani(F(38), 0.5 + 0.4 * k / len(roll_t), _r(), 0.5), t, 0.0, 0.6)
    pad(b, 46.4, [38, 45, 62, 63, 70], w["stops"] - 46.45, 0.65, att=0.6, rel=0.12, warm=1200, name="cluster", trem=trem)
    # ---------------- J below the stone: near-silence, one high held note
    pad(b, w["stops"] + 0.25, [81], 2.5, 0.12, att=1.2, rel=0.9, warm=2200, name="air")
    # ---------------- K still standing: a warm D major chord, a koto arpeggio and glock on "still standing"
    pad(b, w["every"] - 0.05, [50, 57, 62, 66, 69], T.DUR - w["every"] + 0.3, 0.5, att=1.2, rel=0.2, warm=1300)
    pad(b, w["still"] - 0.05, [38, 45, 54, 62, 66, 69, 74], T.DUR - w["still"] + 0.3, 0.55, att=0.25, rel=0.2, warm=1500, name="final")
    for k, m in enumerate([62, 66, 69, 74, 78]):
        koto(b, w["still"] + 0.06 * k, m, 0.6, -0.3 + 0.15 * k, 2.4, bright=0.6)
    for k, m in enumerate([86, 90, 93]):
        b.add("glock", I.glock(F(m), 0.38, _r(), 2.0), w["standing"] + 0.05 + 0.12 * k, 0.2)
    return b


TARGET = {"koto": -4.0, "pad": -8.0, "drone": -9.0, "air": -16.0, "glock": -9.0, "timp": -8.0, "brush": -15.0, "musicbox": -6.0,
          "cluster": -9.0, "final": -9.0}


def render(b, ref=-20.0):
    hall = make_ir(1.8, 7, pre=0.02, hf=1.3)
    dry, wet = np.zeros((2, N)), np.zeros((2, N))
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        g = dbg(ref + TARGET.get(k, -6) - integrated(x))
        x = x * g
        b.tr[k] = x
        dry += x
        wet += b.send[k] * x
    out = hp(dry + 0.8 * convolve_st(wet.mean(0), hall)[:, :N], 30, 2)
    return out, {}
