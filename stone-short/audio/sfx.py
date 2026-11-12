# Every sound effect + ambience bed of "The Stone That Saved a Village" as a cue list timed to the picture (timeline.py),
# rendered into one stereo SFX stem, all synthesized here (the template's dsp / sfx_gen, the Mandel generators in
# sfx_lib.py, and the new generators below: chisel taps, rope creak, the earthquake rumble, the cup rattle, the roar of
# the water, the swell, the fizz when the water stops, the closing birdsong).
# Levels follow the user's standard mix: each EVENT has a "naive" level (LU vs the voice stem, max momentary loudness)
# and is placed SFX_DB = -6 dB under it; ambience BEDS (integrated loudness) are not reduced. Interiors get a small room.
# Tone: a real disaster. The water is heard as weight and distance (rumble, roar, hiss), never as a gag.
import numpy as np
from dsp import (SR, ns, rng, dbg, lp, hp, bp, pan, place, fades, widen, make_ir, convolve_st, momentary_max, integrated,
                 colored, smooth_noise, modal)
import sfx_gen as G
import sfx_lib as L
import timeline as T

N = ns(T.DUR)
SFX_DB = -10.0   # rebuild: quieter SFX (was -6 dB); no music at all
BED_DB = -4.0    # ambience beds trimmed too


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, room="yard", send=0.12):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.room, self.send = kind, p, extra, room, send
        self.applied = naive + (SFX_DB if kind == "event" else BED_DB) + extra
        self.measured = None


def env_pts(n, pts):
    t = np.arange(n) / SR
    return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])


# ---------------------------------------------------------------- new generators
def chisel_tap(r, big=1.0):
    """a mallet on a chisel into granite: a bright metallic tick, a stone crack and a few falling grains"""
    d = 0.5
    n = ns(d)
    m = modal(d, [(r.uniform(2900, 3300), 0.035, 1.0), (r.uniform(5200, 5800), 0.025, 0.6), (r.uniform(8300, 9000), 0.018, 0.35)], r)
    crack = hp(colored(n, r, 0.3), 1500) * np.exp(-np.arange(n) / ns(0.012)) * 1.6
    thud = lp(colored(n, r, 1.0), 400) * np.exp(-np.arange(n) / ns(0.03)) * 0.8
    grains = np.zeros(n)
    for k in range(int(r.integers(3, 7))):
        i0 = ns(r.uniform(0.05, 0.3))
        g = hp(colored(ns(0.01), r, 0.0), 3000) * np.hanning(ns(0.01)) * r.uniform(0.1, 0.3)
        grains[i0:i0 + len(g)] += g[: n - i0]
    return fades((m[: n] * 0.6 + crack + thud + grains) * big, 0.0005, 0.05)


def rope_creak(r, d=1.2):
    """a hemp rope under load over a wooden sledge: slow stick-slip groans and fibre squeaks"""
    c = G.creak(d, r, rate0=r.uniform(40, 60), rate1=r.uniform(80, 120), modes=G.TIMBER, rough=0.25, noise=0.12, scale=0.9)
    fib = bp(colored(ns(d), r, 0.5), 900, 2600, 2) * (0.3 + 0.7 * (0.5 + 0.5 * smooth_noise(ns(d), r, 7.0))) * 0.25
    return fades(c + fib, 0.03, 0.12)


def rumble(r, d, peak=1.0):
    """the earthquake: a sub-bass roll swelling in, a deep grinding, the house rattling on top"""
    n = ns(d)
    e = env_pts(n, [(0, 0.0), (0.35, 0.7), (1.0, 1.0), (d - 0.6, 0.9), (d, 0.0)])
    sub = lp(colored(n, r, 2.0), 55, 4) * 3.0
    grind = lp(bp(colored(n, r, 1.2), 40, 260, 2), 220) * (0.6 + 0.4 * smooth_noise(n, r, 3.0)) * 1.4
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * np.cumsum(5.5 + 2.0 * smooth_noise(n, r, 1.0)) / SR)
    y = (sub + grind) * trem * e * peak
    return fades(np.vstack([y, y * 0.96 + lp(colored(n, r, 2.0), 50) * e * 0.4]), 0.05, 0.15)


def cup_rattle(r, d):
    """a teacup and the teapot lid chattering on the low table"""
    n = ns(d)
    y = np.zeros(n)
    e = env_pts(n, [(0, 0.0), (0.25, 1.0), (d - 0.3, 0.9), (d, 0.0)])
    tm = 0.02
    while tm < d - 0.05:
        f0 = r.uniform(2300, 3400)
        c = modal(0.12, [(f0, 0.02, 1.0), (f0 * 2.31, 0.015, 0.5), (f0 * 3.9, 0.01, 0.25)], r) * r.uniform(0.4, 1.0)
        i0 = ns(tm)
        y[i0:i0 + len(c)] += c[: n - i0] * e[min(i0, n - 1)]
        tm += r.uniform(0.035, 0.11)
    lid = G.rattle(d, r, density=18.0) * e * 0.5
    return fades(y * 0.8 + lid, 0.01, 0.1)


def water_roar(r, d, peak=1.0, surge=0.5):
    """a vast body of water moving: a low roar, churning mid hiss, surges, wood knocking in it (no screams, no splashes)"""
    n = ns(d)
    e = env_pts(n, [(0, 0.0), (min(1.2, d * 0.3), 1.0), (d - 0.5, 1.0), (d, 0.0)])
    out = np.zeros((2, n))
    for ch in range(2):
        low = lp(colored(n, r, 1.8), 180, 2) * 2.2
        mid = bp(colored(n, r, 0.9), 220, 3200, 1) * (0.7 + surge * smooth_noise(n, r, 0.7))
        hiss = hp(colored(n, r, 0.3), 3500) * (0.25 + 0.2 * smooth_noise(n, r, 2.0))
        out[ch] = (low + mid + hiss) * e * peak
    tm = 0.6
    while tm < d - 0.4:
        k = G.creak(r.uniform(0.15, 0.3), r, rate0=60, rate1=90, modes=G.TIMBER, rough=0.3, scale=0.6) * 0.5
        place(out, pan(k, r.uniform(-0.7, 0.7)), tm)
        tm += r.uniform(0.6, 1.4)
    return fades(out, 0.08, 0.2)


def swell_rumble(r, d):
    """the 1896 swell building far out at sea: a low rising roar under the storm wind"""
    n = ns(d)
    e = env_pts(n, [(0, 0.0), (d * 0.7, 0.8), (d, 1.0)])
    y = lp(colored(n, r, 1.9), 120, 2) * 2.5 + bp(colored(n, r, 1.0), 120, 900, 1) * 0.6
    return fades(np.vstack([y, y]) * e, 0.3, 0.3)


def fizz_out(r, d=2.4):
    """the foam stops: the roar falls away, a long hiss of draining foam and a few gurgles"""
    n = ns(d)
    e = np.exp(-np.arange(n) / ns(d * 0.35))
    hiss = np.vstack([hp(colored(n, r, 0.4), 2000) * e * 0.5 for _ in range(2)])
    gl = G.bubbles(d * 0.8, r, 9.0, f_lo=250, f_hi=1100) * 0.4
    place(hiss, pan(gl, 0.2), 0.2)
    return fades(hiss, 0.01, 0.4)


def boom(r, d=2.2, f0=48.0):
    """the map: one deep, soft pressure boom as the rings spread (no crash)"""
    n = ns(d)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f0 * t * (1 - 0.15 * t / d)) * np.exp(-t / 0.7) * 1.2 + lp(colored(n, r, 1.6), 120) * np.exp(-t / 0.5) * 0.8
    return fades(np.vstack([y, y]), 0.004, 0.3)


def songbirds(r, d, density=1.2):
    """a calm evening: sparrows plus a slow two-note songbird and a far-off cuckoo-like call"""
    out = widen(G.bird_chirps(d, r, density, "sparrow"), r, 9, 0.8) * 0.6
    n = ns(d)
    y = np.zeros(n)
    tm = r.uniform(0.3, 0.8)
    while tm < d - 0.8:
        for k, (fa, fb) in enumerate([(r.uniform(2400, 2800), r.uniform(1900, 2200)), (r.uniform(2000, 2300), r.uniform(2600, 3000))]):
            m = ns(0.16)
            tl = np.arange(m) / SR
            f = fa + (fb - fa) * tl / 0.16
            c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tl / 0.16) ** 2
            i0 = ns(tm + k * 0.2)
            y[i0:i0 + m] += c[: max(0, n - i0)] * 0.25
        tm += r.uniform(1.4, 2.4)
    return out + pan(y, 0.35)


def footsteps_run(r, d, rate=6.5):
    """people running up a gravel road (a few pairs of feet, quick and light)"""
    n = ns(d)
    out = np.zeros((2, n))
    tm = 0.0
    while tm < d - 0.1:
        s = G.stroll_step(r, scuff=0.7) * r.uniform(0.5, 1.0)
        place(out, pan(s, r.uniform(-0.6, 0.6)), tm)
        tm += r.uniform(0.6, 1.4) / rate
    return out


def storm_bed(r, dur):
    """1896 / 1933 dusk: gusting storm wind and heavy surf"""
    return L.wind_bed(r, dur, 1.0) * 0.9 + L.surf_bed(r, dur, 1.4)[:, : ns(dur)]


def night_bed(r, dur):
    """the lantern night: crickets, a soft breeze, the sea far below"""
    n = ns(dur)
    out = widen(G.crickets(dur, r, 4), r, 7, 0.8) * 0.35 + G.breeze(dur, r, 0.5)[:, :n] * 0.5 + L.surf_bed(r, dur, 0.5)[:, :n] * 0.3
    return fades(out[:, :n], 0.05, 0.05)


def hill_bed(r, dur, birds=0.6):
    """the valley by day: wind in the cedars, birds, the sea far below"""
    n = ns(dur)
    out = G.breeze(dur, r, 0.8)[:, :n] + widen(G.bird_chirps(dur, r, birds, "sparrow"), r, 9, 0.8)[:, :n] * 0.4 + L.surf_bed(r, dur, 0.4)[:, :n] * 0.35
    return fades(out, 0.05, 0.05)


def town_bed(r, dur):
    """the town by the water: bustle, gulls, a boat engine putting in the harbour"""
    n = ns(dur)
    out = L.market_bed(r, dur)[:, :n] * 0.8 + widen(L.gulls(r, dur, 0.45), r, 9, 0.8)[:, :n] * 0.5
    t = np.arange(n) / SR
    putt = lp(colored(n, r, 1.0), 300) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7.5 * t))) * 0.25
    return fades(out + np.vstack([putt, putt * 0.8]), 0.05, 0.05)


def room2011_bed(r, dur):
    """the living room: a quiet room tone, a wall clock ticking, a little wind at the window"""
    n = ns(dur)
    out = L.room_bed(r, dur)[:, :n] * 0.7
    tk = np.zeros(n)
    for k in range(int(dur)):
        c = modal(0.05, [(2600, 0.01, 1.0), (4100, 0.008, 0.5)], r) * 0.35
        i0 = ns(k + 0.3)
        tk[i0:i0 + len(c)] += c[: max(0, n - i0)]
    return fades(out + pan(tk, -0.4), 0.03, 0.03)


# ---------------------------------------------------------------- the cue list
def cues():
    C = []
    R = rng(1896)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    f = T.fr
    S = T.SHOTS
    beds = {
        "hill_golden": (lambda r, d: hill_bed(r, d, 0.5), -25.0), "storm": (storm_bed, -20.0), "lantern": (night_bed, -26.0),
        "town": (town_bed, -25.0), "harbour": (lambda r, d: L.harbor_bed(r, d), -23.0), "market": (town_bed, -22.0),
        "corner": (lambda r, d: hill_bed(r, d, 0.9), -25.0), "dawn": (lambda r, d: hill_bed(r, d, 1.1), -24.0), "room": (room2011_bed, -30.0),
        "map": (lambda r, d: L.wind_bed(r, d, 0.4), -30.0), "wave": (lambda r, d: L.wind_bed(r, d, 0.9), -24.0), "valley": (lambda r, d: L.wind_bed(r, d, 0.8), -25.0),
        "sunset": (lambda r, d: G.breeze(d, r, 0.4), -30.0),
    }
    # ---- one bed per shot, fading with the picture's crossfades (consecutive shots in one place share a smooth hand-over)
    for i in range(1, 23):
        a0, b0, pl = S[i]
        xi, xo = T.XFADE.get(i, 0) / 2, T.XFADE.get(i + 1, 0) / 2
        a, d = f(a0 - max(xi, 4)), f(b0 + max(xo, 4) - (a0 - max(xi, 4)))
        fi, fo = max(0.08, f(2 * max(xi, 4))), max(0.08, f(2 * max(xo, 4)))
        gen, lvl = beds[pl]
        add(Cue(a, f"bed: {pl}", f"shot {i} ambience", lambda r=rr(), d=d, gen=gen, fi=fi, fo=fo: (fades(gen(r, d), fi, fo), 0.0), lvl, kind="bed", send=0.0))
    # ---- 1 the stone, the reveal, the push back in
    add(Cue(f(T.REVEAL), "crane up", "the lens pulls off the carved face into the wind", lambda r=rr(): L.whoosh(r, 1.6, 180, 900, 0.45), -18.0))
    # ---- 2-6 1896 and 1933
    add(Cue(f(T.SWELL[0]), "the swell", "a low roar builds far out at sea", lambda r=rr(): (swell_rumble(r, f(T.SWELL[1] - T.SWELL[0]) + 0.6), 0.0), -10.0, kind="bed"))
    add(Cue(f(T.FLOOD_1933[0]), "water between the houses", "water rushing between the 1933 houses, at a distance", lambda r=rr(): (lp(water_roar(r, 2.6, 0.8, 0.6), 2600), 0.0), -13.0, kind="bed"))
    # ---- 7 carving: hammer taps in time with the picture (every 14 frames, the blow at the tap's start)
    for k, fr_ in enumerate(range(533, 583, T.TAP_PERIOD)):
        add(Cue(f(fr_ + 3), f"chisel tap {k + 1}", "mallet on chisel into granite", lambda r=rr(), b=1.0 - 0.1 * (k % 2): (chisel_tap(r, b), 0.0), -9.0, p=0.25, send=0.15))
    # ---- 8 the haul: rope creaks under the load, feet on the path
    for k, t0 in enumerate([583, 602, 619]):
        add(Cue(f(t0), f"rope creak {k + 1}", "the haul ropes groan over the sledge", lambda r=rr(): (rope_creak(r, 1.0), 0.0), -12.0, p=-0.2, send=0.1))
    add(Cue(f(590), "haulers' feet", "feet digging into the path", lambda r=rr(): (footsteps_run(r, 1.4, 3.0), 0.0), -18.0))
    # ---- 9-11 the town: a time-lapse whoosh, gulls, the gull steals the fish
    add(Cue(f(640), "time-lapse", "the town grows: a long airy rush", lambda r=rr(): L.whoosh(r, 3.6, 300, 2400, 0.35), -20.0))
    add(Cue(f(T.GULL - 8), "gull swoop", "a gull swoops in", lambda r=rr(): L.whoosh(r, 0.5, 600, 3000, 0.3), -16.0, p=0.4))
    add(Cue(f(T.GULL), "gull squawk", "the gull's cry as it grabs the fish", lambda r=rr(): L.squawk(r), -11.0, p=0.3))
    add(Cue(f(T.GULL + 2), "wings", "wing flaps as it flies off", lambda r=rr(): L.flutter(r, 0.8), -14.0, p=-0.2))
    # ---- 12-13 the forgotten stone: a sparrow
    add(Cue(f(905), "sparrow", "a sparrow chirps near his crumbs", lambda r=rr(): (G.bird_chirps(2.0, r, 2.0, "sparrow"), 0.0), -16.0, p=0.3))
    # ---- 16-17 2011: the calendar, the ground starts shaking, the cup rattles
    add(Cue(f(1134), "page", "the calendar page stirs", lambda r=rr(): L.paper(r, 0.4, 0.5), -20.0))
    add(Cue(f(T.SHAKE - 4), "earthquake rumble", "a low rumble swells up out of the ground", lambda r=rr(): (rumble(r, f(1240 - T.SHAKE) + 0.4, 1.0), 0.0), -9.0, kind="bed"))
    add(Cue(f(T.SHAKE + 2), "cup rattle", "the teacup and the lid chatter on the table", lambda r=rr(): (cup_rattle(r, f(1228 - T.SHAKE) + 0.2), 0.0), -10.0, p=0.15, room="room", send=0.12))
    # ---- 18 the map: one soft deep boom as the rings spread
    add(Cue(f(T.RINGS), "boom", "the quake far offshore", lambda r=rr(): (boom(r), 0.0), -12.0))
    add(Cue(f(T.WAVE_LINE), "wave line", "a deep rush as the wave line heads for the coast", lambda r=rr(): (lp(L.whoosh(r, 1.4, 120, 700, 0.6)[0], 900), 0.0), -15.0))
    # ---- 19-21 the wave over the town, up the valley, and the stop
    add(Cue(f(T.TOWN_WAVE[0]), "roar: town", "the water mass sweeps over the town (wide, distant)", lambda r=rr(): (water_roar(r, f(T.TOWN_WAVE[1] - T.TOWN_WAVE[0]) + 0.5, 1.0, 0.6), 0.0), -9.0, kind="bed"))
    add(Cue(f(1396), "whip", "the whip into the valley", lambda r=rr(): L.whoosh(r, 0.35, 400, 2400, 0.5), -15.0))
    add(Cue(f(T.CLIMB[0]), "roar: valley", "the water climbs the valley, far below", lambda r=rr(): (water_roar(r, f(T.STOP[1] - T.CLIMB[0]), 0.9, 0.8), 0.0), -10.0, kind="bed"))
    add(Cue(f(1402), "running feet", "people run uphill past the lens", lambda r=rr(): (footsteps_run(r, 2.2, 7.0), 0.0), -14.0))
    add(Cue(f(T.STOP[0] + 20), "fizz", "the foam stops and drains away", lambda r=rr(): (fizz_out(r, 2.6), 0.0), -16.0))
    # ---- 22 the end: silence, then birdsong over the hamlet
    add(Cue(f(1560), "birdsong", "evening birds over the eleven houses", lambda r=rr(): (songbirds(r, f(T.TOTAL - 1560) + 0.2), 0.0), -24.0, kind="bed"))
    return C


def render(v_ref, on_event=None):
    """v_ref = integrated loudness of the voice stem (stereo). Returns (stereo stem, cue list with measured levels)."""
    C = cues()
    out = np.zeros((2, N))
    sends = {"yard": np.zeros(N), "room": np.zeros(N)}
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(sends[c.room], c.send * x.mean(0), t0)
    yard = make_ir(1.4, 81, pre=0.02, hf=1.6, early=[(0.09, 0.35, -0.5), (0.17, 0.22, 0.5)])
    room = make_ir(0.4, 82, pre=0.004, hf=1.5, early=[(0.011, 0.5, -0.6), (0.017, 0.4, 0.6), (0.026, 0.3, 0.0)])
    out += 0.45 * convolve_st(sends["yard"], yard)[:, :N] + 0.6 * convolve_st(sends["room"], room)[:, :N]
    out = hp(out, 22, 2)
    return out[:, :N], C
