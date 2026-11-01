# Every sound effect + ambience bed of "The Warm Bucket" as a cue list timed to the picture (timeline.py), rendered
# into one stereo SFX stem. Levels follow the user's standard mix (as the bridge template): each EVENT has a "naive"
# level (LU relative to the voice stem, measured as its max momentary loudness) and is placed SFX_DB = -6 dB under it;
# ambience BEDS (integrated loudness) are not reduced. Street sounds get the open-air yard reverb, cellar sounds a
# small stone room.
import numpy as np
from dsp import (SR, ns, tt, rng, dbg, lp, hp, bp, peq, pan, st, place, fades, widen, make_ir, convolve_st,
                 momentary_max, integrated, colored, smooth_noise, modal, reson, resbank)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, room="yard", send=0.12):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.room, self.send = kind, p, extra, lpf, room, send
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


# ---------------------------------------------------------------- generators (own synthesis on the template's dsp)
def snow_step(r, weight=1.0):
    """boot into fresh snow: soft low thud + a dense granular 'crunch' (many tiny crystal fractures) with a squeak"""
    dur = 0.32
    t = tt(dur)
    n = len(t)
    thud = np.sin(2 * np.pi * r.uniform(70, 95) * t) * np.exp(-t / 0.035) * 0.6 * weight
    grains = np.zeros(n)
    k = int(r.uniform(160, 240))
    times = np.sort(np.abs(r.normal(0.05, 0.045, k)))
    for ti in times:
        i = int(ti * SR)
        if i < n - 40:
            grains[i] += r.uniform(0.3, 1.0) * (1 if r.random() < 0.5 else -1)
    crunch = bp(grains, 1200, 6500, 2) + 0.35 * reson(grains, r.uniform(2200, 3000), 6)
    env = np.exp(-t / 0.09)
    sq = np.sin(2 * np.pi * (r.uniform(900, 1300) + 400 * t) * t) * np.exp(-((t - 0.07) / 0.03) ** 2) * 0.05
    return fades(thud + crunch * env * 0.9 + sq, 0.001, 0.04), 0.0


def handle_clink(r):
    """the bucket's wire handle shifting in its ears on a step"""
    return G.clink(r, f0=r.uniform(2600, 3400), dur=0.1, bright=0.6) * 0.6, 0.0


def hatch_creak(r):
    """old bulkhead door hinges: slow wooden creak rising in pitch, iron hinge squeal on top, a soft knock as it rests"""
    d = (T.HATCH_OPEN[1] - T.HATCH_OPEN[0]) / T.FPS + 0.08
    a = G.creak(d, r, rate0=70, rate1=150, shape_pts=[(0, 0), (0.12, 1), (0.75, 0.8), (1, 0)], rough=0.2, scale=0.9)
    b = G.creak(d * 0.8, r, rate0=320, rate1=520, modes=[(1450, 25, 0.5), (2300, 30, 0.35), (3900, 35, 0.2)], rough=0.08, noise=0.02) * 0.45
    y = np.zeros(ns(d + 0.35))
    y[: len(a)] += a
    y[ns(0.04): ns(0.04) + len(b)] += b
    knock = modal(0.3, [(r.uniform(150, 190), 0.8, 0.05), (r.uniform(380, 450), 0.4, 0.03)], r)
    y[ns(d - 0.02): ns(d - 0.02) + len(knock)] += 0.5 * knock
    return fades(y, 0.005, 0.05), 0.0


def bucket_clank(r):
    """steel bucket set down on a stone floor: hollow body ring + rim clank + handle drop + water slosh"""
    dur = 1.0
    t = tt(dur)
    body = modal(dur, [(r.uniform(330, 360), 0.8, 0.16), (r.uniform(780, 820), 0.55, 0.11), (r.uniform(1460, 1520), 0.4, 0.07),
                       (r.uniform(2350, 2450), 0.25, 0.045), (r.uniform(3600, 3800), 0.15, 0.03)], r)
    knock = np.sin(2 * np.pi * 95 * t) * np.exp(-t / 0.03) * 0.7
    tick = hp(r.standard_normal(len(t)), 2500) * np.exp(-t / 0.002) * 0.35
    y = body + knock + tick
    h = G.clink(r, f0=2900, dur=0.15, bright=0.8)
    y[ns(0.09): ns(0.09) + len(h)] += 0.45 * h
    sl = G.bubbles(0.6, r, 22, f_lo=350, f_hi=1400)
    sl = sl.mean(0) if np.ndim(sl) > 1 else sl
    slosh = lp(colored(ns(0.6), r, 1.0), 900) * np.exp(-tt(0.6) / 0.15) * 0.25
    y[ns(0.02): ns(0.02) + ns(0.6)] += 0.18 * sl[: ns(0.6)] + slosh
    return fades(y, 0.0005, 0.08), 0.0


def ice_crackle(r, dur):
    """water freezing at the surface: sparse fine ticks and tinkles that thicken, then settle (soft)"""
    n = ns(dur)
    t = np.arange(n) / SR
    rate = 14 + 60 * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    y = np.zeros(n)
    k, ti = 0, 0.02
    while ti < dur - 0.05 and k < 600:
        i = int(ti * SR)
        g = r.uniform(0.15, 1.0)
        if r.random() < 0.18:   # a tiny crystalline ping
            p = modal(0.12, [(r.uniform(3200, 6800), 1.0, r.uniform(0.01, 0.03)), (r.uniform(7000, 9500), 0.4, 0.008)], r) * 0.5 * g
        else:                   # a dry fracture tick
            p = hp(r.standard_normal(ns(0.006)), 2500) * np.exp(-tt(0.006) / 0.0012) * g
        j = min(n, i + len(p)); y[i:j] += p[: j - i]
        ti += r.exponential(1.0 / rate[min(i, n - 1)]); k += 1
    y += 0.04 * hp(colored(n, r, 0.5), 4000) * np.sin(np.pi * np.clip(t / dur, 0, 1))
    return fades(y, 0.02, 0.15), 0.0


def warm_swell(r, dur=1.4):
    """the heat leaving the ice: a soft low airy swell (no pitch), like breath on a window"""
    y = G.whoosh(dur, r, peak=0.35, f_lo=180, f_hi=900, width=0.9, tail=0.5, air=0.05)
    y = y.mean(0) if np.ndim(y) > 1 else y
    return fades(lp(y, 1500), 0.05, 0.3), 0.0


def wind_bed(r, dur, gust=0.6):
    """cold breeze over the lane: pink-brown noise, slow gusts, a faint high whistle"""
    n = ns(dur)
    g = 0.6 + 0.4 * (0.5 + 0.5 * smooth_noise(n, r, 0.6)) * gust
    body = bp(colored(n, r, 1.4), 120, 2200, 1) * g
    whistle = 0.05 * bp(colored(n, r, 0.0), 1800, 2600, 2) * (0.5 + 0.5 * smooth_noise(n, r, 0.4))
    L = body + whistle
    R_ = bp(colored(n, r, 1.4), 120, 2200, 1) * g + whistle
    return fades(np.vstack([L, R_]), 0.15, 0.02), 0.0


def cellar_bed(r, dur):
    """inside the cellar: low room tone, the wind muffled through the little window, a faint lantern flame flutter"""
    n = ns(dur)
    tone = lp(colored(n, r, 2.0), 180) * 0.8
    wind = lp(bp(colored(n, r, 1.3), 150, 1200, 1), 700) * (0.5 + 0.35 * smooth_noise(n, r, 0.5)) * 0.6
    flame = bp(colored(n, r, 0.5), 300, 1600, 1) * (0.5 + 0.5 * smooth_noise(n, r, 4.0)) * 0.08
    y = tone + wind + flame
    return fades(np.vstack([y, lp(colored(n, r, 2.0), 180) * 0.8 + wind + flame]), 0.02, 0.02), 0.0


def glide_whoosh(r):
    """the rooftop -> eye level glide: a soft airy whoosh peaking at the glide's centre"""
    d = (T.GLIDE[1] - T.GLIDE[0]) / T.FPS
    y = G.whoosh(d, r, peak=0.5, f_lo=250, f_hi=1500, width=0.7, tail=0.25, air=0.12)
    return (y.mean(0) if np.ndim(y) > 1 else y), 0.0


# ---------------------------------------------------------------- cue list
def cues():
    C = []
    R = rng(1866)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    cut = T.CUT_CELLAR
    # beds (not reduced): wind on the lane until the cut, the cellar room after it (hard cut with the picture)
    add(Cue(0.0, "wind", "cold breeze over the snowy lane", lambda r=rr(): wind_bed(r, cut), -24.0, kind="bed", p=0.0, send=0.0))
    add(Cue(cut, "cellar room", "room tone + wind muffled through the window + lantern flutter", lambda r=rr(): cellar_bed(r, T.DUR - cut), -27.0, kind="bed", send=0.0))
    # shot 1
    add(Cue(T.fr(T.GLIDE[0]), "glide whoosh", "camera glides down from rooftop height", lambda r=rr(): glide_whoosh(r), -14.0, p=0.1, send=0.1))
    steps = [0.03] + T.footfalls()
    for i, ts in enumerate(steps):
        last = i == len(steps) - 1
        add(Cue(ts, "snow step", f"footstep in snow {i + 1}{' (stop)' if last else ''}", lambda r=rr(), w=(1.2 if last else 1.0): snow_step(r, w),
                -4.0 + (1.0 if last else 0.0) + 1.2 * i / len(steps), p=-0.15, send=0.08))
        if not last:
            add(Cue(ts + 0.05, "handle clink", "bucket handle shifts", lambda r=rr(): handle_clink(r), -12.0, p=0.1, send=0.06))
    add(Cue(T.fr(T.HATCH_OPEN[0]), "hatch creak", "cellar hatch door creaks open (on 'cellar'), knocks against the wall", lambda r=rr(): hatch_creak(r), -2.0, p=-0.3, send=0.15))
    # shot 2
    add(Cue(T.fr(T.SETDOWN_LAND), "bucket clank", "steel bucket set down on the stone floor (before 'potatoes')", lambda r=rr(): bucket_clank(r), -1.0, p=0.1, room="cellar", send=0.25))
    # shot 3
    add(Cue(T.fr(T.ICE[0]), "ice crackle", "water freezing: fine ticks + tiny pings as the crystals spread", lambda r=rr(): ice_crackle(r, T.fr(T.ICE[1] - T.ICE[0]) + 0.6), -6.0, room="cellar", send=0.2))
    add(Cue(T.fr(T.GLOW0), "warm swell", "the heat rising off the ice into the potatoes (on 'heat')", lambda r=rr(): warm_swell(r), -10.0, p=0.2, room="cellar", send=0.2))
    return C


def render(v_ref, on_event=None):
    """v_ref = integrated loudness of the voice stem (stereo). Returns (stereo stem, cue list with measured levels)."""
    C = cues()
    out = np.zeros((2, N))
    sends = {"yard": np.zeros(N), "cellar": np.zeros(N)}
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(sends[c.room], c.send * x.mean(0), t0)
    yard = make_ir(0.9, 81, pre=0.01, hf=1.8, early=[(0.07, 0.4, -0.5), (0.13, 0.25, 0.5)])
    room = make_ir(0.45, 82, pre=0.004, hf=1.5, early=[(0.011, 0.5, -0.6), (0.017, 0.4, 0.6), (0.026, 0.3, 0.0)])
    wy, wc = convolve_st(sends["yard"], yard), convolve_st(sends["cellar"], room)
    wy[:, ns(T.CUT_CELLAR):] *= 0.0           # the street's reverb tail stops on the hard cut
    out += 0.5 * wy + 0.6 * wc
    out = hp(out, 25, 2)
    return out, C
