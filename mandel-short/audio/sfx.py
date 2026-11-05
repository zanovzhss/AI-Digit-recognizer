# Every sound effect + ambience bed of "The Man Who Won the Lottery 14 Times" as a cue list timed to the picture
# (timeline.py), rendered into one stereo SFX stem, all synthesized here (IceShort's dsp / sfx_gen + new generators below).
# Levels follow the user's standard mix: each EVENT has a "naive" level (LU vs the voice stem, max momentary loudness)
# and is placed SFX_DB = -6 dB under it; ambience BEDS (integrated loudness) are not reduced. Interiors get a small room.
import numpy as np
from dsp import (SR, ns, tt, rng, dbg, lp, hp, bp, peq, pan, place, fades, widen, make_ir, convolve_st,
                 momentary_max, integrated, colored, smooth_noise, modal, reson)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0
INDOOR = {"cell", "hold"}


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, room="yard", send=0.12):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.room, self.send = kind, p, extra, room, send
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None
        self.lpf = None


mono = lambda y: y.mean(0) if np.ndim(y) > 1 else y


# ---------------------------------------------------------------- beds
def surf_bed(r, dur, big=1.0):
    """waves on a beach / open sea: slow swells of washy noise every ~4-6 s, a fizz as each one draws back"""
    n = ns(dur)
    t = np.arange(n) / SR
    env = np.zeros(n)
    tm = r.uniform(-1.5, 0.5)
    while tm < dur:
        L = r.uniform(3.8, 6.0)
        u = (t - tm) / L
        env += np.where((u > 0) & (u < 1), np.sin(np.pi * np.clip(u, 0, 1)) ** 2 * (1 - 0.5 * u), 0) * r.uniform(0.7, 1.0)
        tm += L * r.uniform(0.7, 0.95)
    out = np.zeros((2, n))
    for ch in range(2):
        wash = bp(colored(n, r, 0.9), 150, 5000, 1) * (0.25 + env) * big
        fizz = hp(colored(n, r, 0.2), 3500) * np.clip(np.gradient(env) * -SR * 0.6, 0, 1) * 0.6
        out[ch] = wash + fizz + lp(colored(n, r, 2.0), 140) * 0.4
    return fades(out, 0.05, 0.02)


def gulls(r, dur, density=0.35):
    """distant gulls: high gliding 'kee-ow' calls (formant voice, very bright, short)"""
    n = ns(dur)
    y = np.zeros(n)
    tm = r.uniform(0.2, 1.5)
    while tm < dur - 0.6:
        for k in range(int(r.integers(1, 4))):
            d = r.uniform(0.18, 0.32)
            m = ns(d)
            tl = np.arange(m) / SR
            f0 = r.uniform(900, 1250) * G._track(m, [(0, 1.0), (d * 0.3, 1.25), (d, 0.8)], tl)
            forms = G.vowel_track(m, [(0, "i"), (d * 0.4, "ae"), (d, "a")]) * 1.6
            amp = np.clip(tl / 0.02, 0, 1) * np.clip((d - tl) / 0.06, 0, 1)
            c = G.vox(f0, forms, amp, r, 1.0, tilt=0.8, breath=0.15, fmax=9000)
            G._place_mono(y, c * r.uniform(0.3, 1.0), tm + k * (d + r.uniform(0.04, 0.1)))
        tm += r.exponential(1 / density) + 0.8
    return bp(y, 600, 6000, 1)


def wind_bed(r, dur, gust=0.6):
    n = ns(dur)
    g = 0.6 + 0.4 * (0.5 + 0.5 * smooth_noise(n, r, 0.6)) * gust
    body = [bp(colored(n, r, 1.4), 120, 2200, 1) * g for _ in range(2)]
    whistle = 0.05 * bp(colored(n, r, 0.0), 1800, 2600, 2) * (0.5 + 0.5 * smooth_noise(n, r, 0.4))
    return fades(np.vstack([body[0] + whistle, body[1] + whistle]), 0.05, 0.02)


def harbor_bed(r, dur, warm=False):
    """harbour water slapping the quay, rigging creak, gulls; winter wind (Boston) or warm breeze + insects (port)"""
    n = ns(dur)
    w = G.water_bed(dur, r, close=0.35, slosh_rate=0.5) * 0.6
    air = wind_bed(r, dur, 0.5) * (0.35 if warm else 0.8)
    out = w + air + widen(gulls(r, dur, 0.3), r, 9, 0.8) * 0.5
    if warm:
        out += widen(G.crickets(dur, r, 3), r, 7, 0.8) * 0.12
    return fades(out[:, :n], 0.03, 0.02)


def room_bed(r, dur, creaks=False):
    """inside the cell / the hold: low room tone, muffled air through the window / hatch, timber creaks for the hold"""
    n = ns(dur)
    y = lp(colored(n, r, 2.0), 180) * 0.8 + lp(bp(colored(n, r, 1.3), 150, 1200, 1), 700) * (0.5 + 0.35 * smooth_noise(n, r, 0.5)) * 0.5
    out = np.vstack([y, lp(colored(n, r, 2.0), 180) * 0.8 + y * 0.6])
    if creaks:
        tm = 0.3
        while tm < dur - 1.2:
            c = G.creak(r.uniform(0.5, 0.9), r, rate0=r.uniform(50, 80), rate1=r.uniform(90, 140), rough=0.2, scale=0.8) * 0.5
            place(out, pan(c, r.uniform(-0.6, 0.6)), tm)
            tm += r.uniform(1.3, 2.4)
    return fades(out, 0.03, 0.02)


def market_bed(r, dur):
    """the Calcutta ice market: many voices at a distance, a few glass clinks"""
    n = ns(dur)
    out = np.zeros((2, n))
    for k in range(9):
        v = G.babble(dur, r, r.uniform(110, 240), r.uniform(0.95, 1.2), rate=r.uniform(3.6, 4.8), active=0.7)
        out += pan(lp(v, 3000), r.uniform(-0.8, 0.8)) * r.uniform(0.4, 1.0)
    out = out / (np.abs(out).max() + 1e-9)
    out += widen(G.rattle(dur, r, density=2.5), r, 9, 0.7) * 0.25
    out += widen(gulls(r, dur, 0.15), r, 9, 0.8) * 0.2
    return fades(out, 0.03, 0.02)


def mill_bed(r, dur):
    """lumber mill yard: birds, breeze, a distant saw blade whining through a log"""
    n = ns(dur)
    out = G.breeze(dur, r, 0.6) + widen(G.bird_chirps(dur, r, 0.8), r, 9, 0.8) * 0.5
    t = np.arange(n) / SR
    whine = np.sin(G.phase(np.full(n, 780.0) * (1 + 0.02 * smooth_noise(n, r, 1.0)))) * 0.15
    whine += bp(colored(n, r, 0.5), 600, 3200, 2) * 0.15
    out += np.vstack([whine, whine]) * (0.4 + 0.6 * (np.sin(2 * np.pi * t / 3.2) > -0.2)) * 0.3
    return fades(out, 0.03, 0.02)


# ---------------------------------------------------------------- events
def whoosh(r, d, lo=250, hi=1500, peak=0.5):
    return mono(G.whoosh(d, r, peak=peak, f_lo=lo, f_hi=hi, width=0.7, tail=0.25, air=0.12)), 0.0


def shimmer(r):
    """the white flash after the hook: a bright airy swish with a glassy ping"""
    y = mono(G.whoosh(0.5, r, peak=0.2, f_lo=1500, f_hi=7000, width=0.6, tail=0.4, air=0.4))
    p = modal(0.8, [(2637, 1.0, 0.25), (3951, 0.5, 0.18), (5274, 0.3, 0.12)], r)
    y = np.pad(y, (0, max(0, len(p) - len(y))))
    y[: len(p)] += 0.25 * p
    return fades(y, 0.002, 0.1), 0.0


def plip(r):
    """a drop of sweat / melt water hitting: tiny bubble plink"""
    return G.bubbles(0.12, r, 30, 900, 2600, (0.006, 0.014), rise=(12, 30))[: ns(0.12)] * 2.0 + 0.0, 0.0


def drips(r, dur, rate):
    return G.bubbles(dur, r, rate, 1100, 3600, (0.005, 0.013), rise=(12, 30)), 0.0


def ice_saw(r, dur, hz=1.5, phase0=0.0):
    """a long ice saw cutting the pond: a toothy rasp on every push and pull, resonant blade ring, ice crunch"""
    n = ns(dur)
    t = np.arange(n) / SR
    speed = np.abs(np.cos(2 * np.pi * hz * t + phase0))
    teeth = np.sin(2 * np.pi * np.cumsum(120 + 260 * speed) / SR) > 0.6
    rasp = bp(colored(n, r, 0.3), 900, 6500, 2) * (0.3 + 0.7 * teeth) * speed ** 1.3
    ring = reson(rasp, r.uniform(2400, 3100), 25) * 0.15
    crunch = hp(colored(n, r, 0.0), 2500) * (r.random(n) < 0.002) * 0.6
    return fades(rasp + ring + crunch, 0.02, 0.05), 0.0


def bell(r, strikes=2):
    """ship's bell: struck bronze partials (hum, prime, tierce, quint, nominal), double strike"""
    f = r.uniform(780, 860)
    one = modal(2.5, [(f * 0.5, 0.5, 1.6), (f, 1.0, 1.1), (f * 1.19, 0.6, 0.8), (f * 1.5, 0.45, 0.6), (f * 2.0, 0.5, 0.5), (f * 2.51, 0.25, 0.3), (f * 3.0, 0.2, 0.2)], r)
    clap = hp(r.standard_normal(ns(0.01)), 2000) * 0.6
    one[: len(clap)] += clap
    y = np.zeros(ns(0.33 * strikes + 2.6))
    for k in range(strikes):
        G._place_mono(y, one * (1 - 0.15 * k), 0.33 * k)
    return fades(y, 0.001, 0.3), 0.0


def thunk(r, wood=True):
    """an ice block set down on deck planks: dull wooden knock + a little ice chink"""
    y = modal(0.4, [(r.uniform(110, 140), 1.0, 0.06), (r.uniform(260, 320), 0.6, 0.04), (r.uniform(700, 820), 0.3, 0.02)], r)
    y += lp(r.standard_normal(len(y)), 900) * np.exp(-tt(0.4) / 0.015) * 0.5
    c = G.clink(r, f0=r.uniform(3200, 4200), dur=0.1, bright=0.5) * 0.25
    y[: len(c)] += c
    return fades(y, 0.0005, 0.05), 0.0


def wood_step(r):
    y = modal(0.2, [(r.uniform(140, 190), 1.0, 0.03), (r.uniform(420, 520), 0.5, 0.02)], r) + bp(r.standard_normal(ns(0.2)), 300, 3000, 1) * np.exp(-tt(0.2) / 0.01) * 0.4
    return fades(y, 0.0005, 0.03), 0.0


def paper(r, d=0.45, crisp=1.0):
    """newspaper / calendar page: crisp crackles over a soft swish"""
    n = ns(d)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.7
    crack = hp(r.standard_normal(n) * (r.random(n) < 0.01) * 4, 1500)
    swish = bp(colored(n, r, 0.4), 1200, 7000, 1) * 0.35
    return fades((crack * crisp + swish) * env, 0.003, 0.03), 0.0


def laugh(r, voices=5, dur=1.4):
    """a little crowd laughing: each voice 'ha-ha-ha' bursts on a falling pitch (formant voice)"""
    out = np.zeros(ns(dur + 0.3))
    for v in range(voices):
        base = r.uniform(140, 300) if v % 2 else r.uniform(95, 150)
        tm = r.uniform(0, 0.25)
        k = 0
        while tm < dur - 0.15:
            d = r.uniform(0.09, 0.14)
            m = ns(d + 0.03)
            tl = np.arange(m) / SR
            f0 = base * (1.25 - 0.04 * k) * G._track(m, [(0, 1.1), (d, 0.92)], tl)
            forms = G.vowel_track(m, [(0, "a"), (d, "A")])
            amp = np.clip(tl / 0.012, 0, 1) * np.clip((d - tl) / 0.03, 0, 1)
            h = G.vox(f0, forms, amp, r, 1.0 + 0.1 * (v % 2), tilt=1.0, breath=0.45, fmax=5000)
            G._place_mono(out, h * r.uniform(0.6, 1.0) * (1 - 0.03 * k), tm)
            tm += d + r.uniform(0.05, 0.1)
            k += 1
            if r.random() < 0.12:
                tm += r.uniform(0.15, 0.3)
    return fades(out, 0.005, 0.15), 0.0


def slip(r):
    """the slip: a squeaky skid, a body thump on the packed snow, an 'oof', two stars twinkling"""
    y = np.zeros(ns(1.3))
    sk = np.sin(G.phase(np.linspace(900, 1700, ns(0.16)))) * np.exp(-tt(0.16) / 0.08) * 0.3 + hp(r.standard_normal(ns(0.16)), 2500) * 0.2
    G._place_mono(y, sk, 0.0)
    th = modal(0.5, [(r.uniform(65, 80), 1.0, 0.09), (r.uniform(150, 180), 0.5, 0.05)], r) + lp(r.standard_normal(ns(0.5)), 600) * np.exp(-tt(0.5) / 0.03) * 0.7
    G._place_mono(y, th, 0.17)
    G._place_mono(y, G.oof(r, "oof") * 0.7, 0.19)
    for k, f in enumerate([2093, 2637, 3136]):
        G._place_mono(y, modal(0.6, [(f, 1.0, 0.25), (f * 2.0, 0.3, 0.1)], r) * 0.18, 0.35 + 0.12 * k)
    return fades(y, 0.001, 0.08), 0.0


def snow_step(r, weight=1.0):
    t = tt(0.32)
    n = len(t)
    thud = np.sin(2 * np.pi * r.uniform(70, 95) * t) * np.exp(-t / 0.035) * 0.6 * weight
    grains = np.zeros(n)
    for ti in np.sort(np.abs(r.normal(0.05, 0.045, int(r.uniform(160, 240))))):
        i = int(ti * SR)
        if i < n - 40:
            grains[i] += r.uniform(0.3, 1.0) * (1 if r.random() < 0.5 else -1)
    crunch = bp(grains, 1200, 6500, 2) + 0.35 * reson(grains, r.uniform(2200, 3000), 6)
    return fades(thud + crunch * np.exp(-t / 0.09) * 0.9, 0.001, 0.04), 0.0


def leather(r):
    """the wallet flap opening: a soft leather creak"""
    return G.creak(0.35, r, rate0=180, rate1=260, rough=0.3, scale=0.5, noise=0.1) * 0.5, 0.0


def coin(r, dur=2.2):
    """the last coin: drops out (ting), rolls away on its edge (a stream of tiny rings), wobbles and settles"""
    n = ns(dur)
    y = np.zeros(n)
    f0 = r.uniform(5200, 6200)
    G._place_mono(y, modal(0.5, [(f0, 1.0, 0.12), (f0 * 1.47, 0.6, 0.09), (f0 * 2.2, 0.3, 0.05)], r), 0.0)
    tm, rate = 0.08, 30.0
    while tm < dur * 0.75:
        c = modal(0.06, [(f0 * r.uniform(0.98, 1.02), 1.0, 0.02), (f0 * 1.47, 0.4, 0.015)], r) * r.uniform(0.15, 0.35)
        G._place_mono(y, c, tm)
        tm += 1.0 / rate
    for k, d in enumerate(np.cumsum([0.12, 0.09, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02])):
        G._place_mono(y, modal(0.08, [(f0 * 0.9, 1.0, 0.03)], r) * (0.5 - 0.04 * k), dur * 0.75 + d)
    roll = bp(colored(n, r, 0.5), 2000, 8000, 1) * np.clip(np.arange(n) / SR / 0.08, 0, 1) * np.clip((dur * 0.95 - np.arange(n) / SR) / 0.4, 0, 1) * 0.05
    return fades(y + roll, 0.0005, 0.1), 0.0


def cell_door(r):
    """the cell door: iron bars slam into the frame (clang + rattle), a key turns the lock"""
    y = np.zeros(ns(2.0))
    clang = modal(1.6, [(r.uniform(180, 220), 1.0, 0.6), (r.uniform(410, 470), 0.8, 0.45), (r.uniform(930, 1010), 0.6, 0.3), (r.uniform(1700, 1850), 0.4, 0.2), (r.uniform(2900, 3100), 0.25, 0.12)], r)
    clang += lp(r.standard_normal(len(clang)), 1500) * np.exp(-tt(1.6) / 0.01) * 0.8
    G._place_mono(y, clang, 0.0)
    G._place_mono(y, G.rattle(0.5, r, density=40, heavy=True) * 0.6, 0.02)
    for k, d in enumerate([0.75, 0.86, 0.95]):
        G._place_mono(y, G.clink(r, f0=r.uniform(1800, 2600), dur=0.12, bright=0.7) * (0.5 if k < 2 else 0.8), d)
    return fades(y, 0.0005, 0.2), 0.0


def yawn(r):
    """the guard's long yawn: rising then falling 'aaaah' with a breathy end"""
    d = (T.YAWN[1] - T.YAWN[0]) / T.FPS
    m = ns(d)
    tl = np.arange(m) / SR
    f0 = 110 * G._track(m, [(0, 1.0), (d * 0.3, 1.55), (d * 0.7, 1.2), (d, 0.85)], tl)
    forms = G.vowel_track(m, [(0, "A"), (d * 0.3, "a"), (d * 0.8, "o"), (d, "u")])
    amp = np.clip(tl / 0.15, 0, 1) * np.clip((d - tl) / 0.3, 0, 1)
    return fades(G.vox(f0, forms, amp, r, 1.0, tilt=1.2, breath=0.6), 0.02, 0.1), 0.0


def ding(r):
    """the idea: a bright little bell 'ding' with a glassy shimmer"""
    y = modal(1.5, [(1568, 1.0, 0.6), (3136, 0.5, 0.35), (4704, 0.25, 0.2), (2093 * 2, 0.2, 0.25)], r)
    return fades(y, 0.0005, 0.2), 0.0


def warm_swell(r, d=1.4):
    y = mono(G.whoosh(d, r, peak=0.35, f_lo=180, f_hi=900, width=0.9, tail=0.5, air=0.05))
    return fades(lp(y, 1500), 0.05, 0.3), 0.0


def cloth(r):
    """the towel wrapped round the bottle: a soft cloth swish and rub"""
    y = mono(G.whoosh(0.6, r, peak=0.4, f_lo=500, f_hi=3500, width=0.6, tail=0.3, air=0.3))
    rub = bp(colored(ns(0.6), r, 0.6), 800, 4000, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt(0.6))) * np.sin(np.pi * np.clip(tt(0.6) / 0.6, 0, 1)) * 0.3
    return fades(y + rub, 0.01, 0.1), 0.0


def boing(r):
    """warm air bouncing off the towel: a soft low bump that bends up, twice"""
    y = np.zeros(ns(0.8))
    for k in range(2):
        m = ns(0.3)
        tl = np.arange(m) / SR
        b = np.sin(G.phase(140 * (1 + 1.2 * tl / 0.3))) * np.exp(-tl / 0.09)
        G._place_mono(y, b * (0.8 - 0.3 * k), 0.12 * k)
    return fades(y, 0.002, 0.1), 0.0


def shovel(r):
    """a shovel into sawdust: soft scoop scrape, the throw, sawdust pattering down"""
    y = np.zeros(ns(1.0))
    sc = bp(colored(ns(0.25), r, 0.5), 600, 5000, 1) * np.sin(np.pi * np.clip(tt(0.25) / 0.25, 0, 1)) * 0.6
    G._place_mono(y, sc, 0.0)
    G._place_mono(y, mono(G.whoosh(0.3, r, peak=0.4, f_lo=400, f_hi=2500, width=0.6, tail=0.3, air=0.2)) * 0.5, 0.3)
    pat = G.bubbles(0.45, r, 140, 2500, 7000, (0.002, 0.005), rise=(0, 1)) * 0.5
    G._place_mono(y, pat, 0.5)
    return fades(y, 0.005, 0.08), 0.0


def creak_ship(r):
    return G.creak(0.9, r, rate0=50, rate1=90, rough=0.25, scale=0.9) * 0.8, 0.0


def sail_flap(r):
    """canvas filling with wind: two soft heavy flaps"""
    y = np.zeros(ns(0.9))
    for k in range(2):
        f = lp(colored(ns(0.25), r, 1.0), 900) * np.exp(-tt(0.25) / 0.06)
        G._place_mono(y, f * (1 - 0.3 * k), 0.22 * k)
    return fades(y, 0.002, 0.1), 0.0


def hatch(r):
    """the hatch cover lifted off: wooden scrape, then a thunk as it's set down on deck"""
    d = (T.HATCH[1] - T.HATCH[0]) / T.FPS
    y = np.zeros(ns(d + 0.6))
    G._place_mono(y, G.creak(d * 0.7, r, rate0=60, rate1=110, rough=0.3, scale=0.8) * 0.7, 0.0)
    G._place_mono(y, thunk(r)[0], d)
    return fades(y, 0.002, 0.1), 0.0


def sparkle(r):
    """ice still frozen: a rising cascade of glassy tings"""
    y = np.zeros(ns(1.4))
    for k, f in enumerate([2637, 3136, 3951, 4699, 5274]):
        G._place_mono(y, modal(0.8, [(f, 1.0, 0.3), (f * 2.01, 0.25, 0.1)], r) * (0.5 + 0.1 * k), 0.07 * k)
    return fades(y, 0.001, 0.2), 0.0


def glass(r):
    """glasses / ice chunks clinking at the stall"""
    y = np.zeros(ns(0.6))
    for k in range(int(r.integers(2, 4))):
        G._place_mono(y, G.clink(r, f0=r.uniform(2800, 4600), dur=0.2, bright=0.9) * r.uniform(0.5, 1.0), 0.08 * k + r.uniform(0, 0.03))
    return fades(y, 0.0005, 0.05), 0.0


# ---------------------------------------------------------------- cue list
# ================================================================ mandel short: extra generators
def cheer(r, d, people=24):
    """a lottery hall crowd cheering: hurrahs, applause, a couple of whistles, rising then settling"""
    n = ns(d)
    t = np.arange(n) / SR
    env = np.clip(t / 0.4, 0, 1) * (0.75 + 0.25 * np.cos(t * 1.3))
    out = G.applause(d, r, people=people, env=env) * 0.7
    for k in range(10):
        h = G.hurrah(r, r.uniform(110, 300), r.uniform(0.9, 1.25), kid=k % 4 == 0)
        place(out, pan(mono(h) if np.ndim(h) > 1 else h, r.uniform(-0.8, 0.8)) * r.uniform(0.4, 0.9), r.uniform(0, max(0.1, d - 1.0)))
    out += widen(G.babble(d, r, 160, 1.1, rate=5.0, active=0.9), r, 9, 0.8) * 0.4
    return fades(out[:, :n], 0.15, 0.4), 0.0


def pop(r):
    """confetti cannon: a dull pneumatic pop + paper spray"""
    y = modal(0.4, [(r.uniform(70, 90), 1.0, 0.05), (r.uniform(180, 220), 0.5, 0.03)], r)
    y += bp(r.standard_normal(len(y)), 1500, 8000, 1) * np.exp(-tt(0.4) / 0.08) * 0.5
    return fades(y, 0.0005, 0.05), 0.0


def heap_thud(r):
    """a man falling stiff into a heap of paper: a soft body thump buried in a burst of rustle"""
    y = modal(0.6, [(r.uniform(55, 70), 1.0, 0.12), (r.uniform(120, 150), 0.5, 0.06)], r)
    rus, _ = paper(r, 0.6, 1.4)
    y[: len(rus)] += rus * 0.9
    return fades(y, 0.002, 0.08), 0.0


def flutter(r, d=0.8):
    """moth wings: a soft fast fluttering rustle"""
    n = ns(d)
    t = np.arange(n) / SR
    y = bp(colored(n, r, 0.6), 700, 4000, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * 26 * t)) ** 2 * np.sin(np.pi * t / d)
    return fades(y, 0.01, 0.1), 0.0


def spring(r, d=0.6, f0=420.0):
    """cartoon spring 'boing': a wobbling twang settling"""
    n = ns(d)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.35 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.18))
    y = np.sin(G.phase(f)) * np.exp(-t / 0.22) + 0.3 * np.sin(2 * G.phase(f)) * np.exp(-t / 0.12)
    return fades(y, 0.002, 0.05), 0.0


def blips(r, d, rate=14.0):
    """the wall's cells switching on: soft electronic blips at random pitches"""
    n = ns(d)
    y = np.zeros(n)
    tm = 0.0
    while tm < d - 0.1:
        f = r.choice([880, 988, 1175, 1319, 1568, 1760])
        b = np.sin(2 * np.pi * f * tt(0.07)) * np.exp(-tt(0.07) / 0.02)
        G._place_mono(y, b * r.uniform(0.4, 1.0), tm)
        tm += r.exponential(1 / rate)
    return y, 0.0


def hum_bed(r, d, f=60.0, buzz=0.3):
    """electric hum / neon buzz: mains harmonics with a little crackle"""
    n = ns(d)
    t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 8)) * 0.3
    y += hp(colored(n, r, 0.0), 3000) * (r.random(n) < 0.0008) * buzz
    y = y * (0.85 + 0.15 * smooth_noise(n, r, 0.3))
    return fades(np.vstack([y, y]), 0.05, 0.05)


def clank(r, big=1.0):
    """brass scale pan swinging down: a metallic clank + ring"""
    f = r.uniform(520, 640)
    y = modal(1.2, [(f, 1.0, 0.5), (f * 2.76, 0.6, 0.3), (f * 5.4, 0.3, 0.15), (f * 0.5, 0.4, 0.2)], r)
    y += hp(r.standard_normal(len(y)), 2000) * np.exp(-tt(1.2) / 0.008) * 0.5
    return fades(y * big, 0.0005, 0.2), 0.0


def street_bed(r, dur):
    """a sunny Melbourne street: breeze, birds, passing cars, a distant tram bell"""
    n = ns(dur)
    out = G.breeze(dur, r, 0.5) + widen(G.bird_chirps(dur, r, 0.9), r, 9, 0.8) * 0.5
    t = np.arange(n) / SR
    for k in range(int(dur / 2.2) + 1):
        c = r.uniform(-1, dur)
        sw = np.exp(-((t - c) / 0.9) ** 2)
        car = lp(colored(n, r, 1.5), 900) * sw * 0.8
        out += pan(car, r.uniform(-0.9, 0.9))
    return fades(out[:, :n], 0.03, 0.02)


def tram_bell(r):
    y = modal(1.0, [(1480, 1.0, 0.4), (2210, 0.5, 0.3), (3700, 0.2, 0.15)], r)
    z = np.zeros(ns(1.3)); G._place_mono(z, y, 0); G._place_mono(z, y * 0.8, 0.22)
    return fades(z, 0.001, 0.2), 0.0


def thump(r, f=80.0, d=0.3):
    y = modal(d, [(f, 1.0, d * 0.3), (f * 2.3, 0.4, d * 0.15)], r) + lp(r.standard_normal(ns(d)), 600) * np.exp(-tt(d) / 0.01) * 0.6
    return fades(y, 0.0005, 0.04), 0.0


def tick(r, f=2400.0):
    """a small mechanical click (plaque number flip, clock tick)"""
    y = modal(0.06, [(f, 1.0, 0.012), (f * 1.7, 0.5, 0.008)], r) + hp(r.standard_normal(ns(0.06)), 2500) * np.exp(-tt(0.06) / 0.002) * 0.6
    return fades(y, 0.0002, 0.01), 0.0


def ticks(r, d, start_rate, end_rate, f=2400.0):
    """a run of ticks speeding up (digits rolling, a racing clock)"""
    y = np.zeros(ns(d))
    tm = 0.0
    while tm < d - 0.05:
        u = tm / d
        G._place_mono(y, tick(r, f * r.uniform(0.95, 1.05))[0] * r.uniform(0.6, 1.0), tm)
        tm += 1 / (start_rate + (end_rate - start_rate) * u)
    return y, 0.0


def groan(r):
    """a jealous 'hmmph' (formant voice, falling)"""
    return mono(G.oof(r)) * 0.9 if np.ndim(G.oof(r)) > 1 else G.oof(r), 0.0


def night_bed(r, dur):
    """a Virginia gas station at night: crickets, distant traffic, the neon's buzz"""
    n = ns(dur)
    out = widen(G.crickets(dur, r, 4), r, 7, 0.8) * 0.35 + G.breeze(dur, r, 0.25)
    t = np.arange(n) / SR
    for k in range(int(dur / 3) + 1):
        c = r.uniform(-1, dur)
        out += pan(lp(colored(n, r, 1.5), 700) * np.exp(-((t - c) / 1.4) ** 2) * 0.5, r.uniform(-0.9, 0.9))
    out += hum_bed(r, dur, 60, 0.2)[:, :n] * 0.12
    return fades(out[:, :n], 0.03, 0.02)


def press(r, d, bpm=240):
    """printing presses running: a rhythmic thump-clack with roller whirr and paper flutter"""
    n = ns(d)
    y = np.zeros(n)
    step = 60 / bpm
    tm = 0.0
    k = 0
    while tm < d:
        G._place_mono(y, thump(r, 95, 0.18)[0] * (1.0 if k % 2 == 0 else 0.6), tm)
        G._place_mono(y, tick(r, 1600)[0] * 0.8, tm + step * 0.5)
        tm += step; k += 1
    t = np.arange(n) / SR
    y += bp(colored(n, r, 0.8), 300, 2500, 1) * 0.15 * (0.7 + 0.3 * np.sin(2 * np.pi * 4 * t))
    return fades(y, 0.05, 0.1), 0.0


def squeak(r, d=0.9):
    """a marker squeaking along the map"""
    n = ns(d)
    t = np.arange(n) / SR
    f = 1800 + 500 * np.sin(2 * np.pi * 1.3 * t) + 200 * smooth_noise(n, r, 3)
    y = np.sin(G.phase(f)) * (0.5 + 0.5 * (smooth_noise(n, r, 8) > 0)) * 0.4 + bp(colored(n, r, 0.3), 2000, 6000, 1) * 0.15
    return fades(y, 0.02, 0.05), 0.0


def horn(r, d=1.6):
    """a cargo ship's horn far off (low reedy tone)"""
    n = ns(d)
    t = np.arange(n) / SR
    y = sum(np.sin(2 * np.pi * 110 * k * t) / k for k in range(1, 9)) * np.clip(t / 0.15, 0, 1) * np.clip((d - t) / 0.4, 0, 1)
    return fades(lp(y, 1400), 0.02, 0.1), 0.0


def run_crowd(r, d, people=26):
    """an army of couriers running: many fast footsteps on concrete, puffing breath, a few shouts"""
    n = ns(d)
    out = np.zeros((2, n))
    for p_ in range(people):
        tm, rate, pp = r.uniform(0, 0.3), r.uniform(3.2, 4.2), r.uniform(-0.9, 0.9)
        while tm < d - 0.1:
            s, _ = G.stroll_step(r, 0.3), 0
            place(out, pan(mono(s) if np.ndim(s) > 1 else s, pp) * r.uniform(0.3, 0.8), tm)
            tm += 1 / rate
    out += widen(G.babble(d, r, 180, 1.1, rate=5.5, active=0.5), r, 9, 0.8) * 0.25
    return fades(out, 0.1, 0.2), 0.0


def avalanche(r, d=1.6):
    """a landslide of paper tickets: a long rising rustle, slithering, a final flump"""
    n = ns(d)
    t = np.arange(n) / SR
    env = np.clip(t / (0.6 * d), 0, 1) ** 1.5 * np.clip((d - t) / 0.25, 0, 1)
    y = (bp(colored(n, r, 0.4), 800, 8000, 1) * 0.7 + hp(r.standard_normal(n) * (r.random(n) < 0.02) * 3, 1500)) * env
    y[ns(0.8 * d):] += thump(r, 70, d * 0.2)[0][: n - ns(0.8 * d)] * 0.8
    return fades(y, 0.02, 0.08), 0.0


def sip(r):
    """a long calm slurp of tea, then a contented 'ahh'"""
    n = ns(0.9)
    t = np.arange(n) / SR
    y = bp(colored(n, r, 0.2), 1200, 5000, 2) * np.sin(np.pi * np.clip(t / 0.5, 0, 1)) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t))
    return fades(y, 0.01, 0.1), 0.0


def slam(r):
    """a heavy binder slammed shut on a desk: a flat slap with a wooden knock"""
    y = modal(0.35, [(r.uniform(140, 170), 1.0, 0.05), (r.uniform(380, 450), 0.6, 0.03)], r)
    y += bp(r.standard_normal(ns(0.35)), 400, 5000, 1) * np.exp(-tt(0.35) / 0.012) * 1.2
    return fades(y, 0.0003, 0.05), 0.0


def hiss(r, d=1.0):
    """steam from the ears: a whistling hiss like a kettle"""
    n = ns(d)
    t = np.arange(n) / SR
    y = hp(colored(n, r, 0.0), 3500) * 0.6 + np.sin(G.phase(np.full(n, 2600.0) * (1 + 0.04 * np.sin(2 * np.pi * 6 * t)))) * 0.25
    return fades(y * np.clip(t / 0.08, 0, 1), 0.01, 0.2), 0.0


def stamp_hit(r):
    """a rubber stamp slammed down: a firm thud on wood + a squelch"""
    y, _ = thump(r, 120, 0.35)
    y[: ns(0.05)] += bp(r.standard_normal(ns(0.05)), 300, 2500, 1) * np.exp(-tt(0.05) / 0.01) * 0.8
    return fades(y, 0.0005, 0.05), 0.0


def office_bed(r, dur):
    """the lottery office: room tone, a wall clock, a typewriter clacking down the hall"""
    n = ns(dur)
    out = room_bed(r, dur)
    y = np.zeros(n)
    tm = r.uniform(0, 0.5)
    while tm < dur - 0.1:
        G._place_mono(y, tick(r, r.uniform(1800, 2600))[0] * 0.5, tm)
        tm += r.choice([0.09, 0.12, 0.15, 0.4])
    out += np.vstack([lp(y, 3500), lp(y, 3500) * 0.7]) * 0.35
    return fades(out[:, :n], 0.03, 0.02)


def squawk(r):
    """a parrot's harsh squawk (bright formant voice, rough)"""
    d = 0.4
    m = ns(d)
    tl = np.arange(m) / SR
    f0 = 900 * G._track(m, [(0, 1.0), (0.12, 1.4), (d, 0.9)], tl)
    forms = G.vowel_track(m, [(0, "a"), (0.2, "ae")]) * 1.9
    amp = np.clip(tl / 0.01, 0, 1) * np.clip((d - tl) / 0.08, 0, 1)
    y = G.vox(f0, forms, amp, r, 1.0, tilt=0.6, breath=0.4, fmax=9000)
    return fades(y, 0.002, 0.05), 0.0


def cues():
    C = []
    R = rng(1992)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    f = T.fr
    S = T.SHOTS
    # ---- beds: one per shot, overlapping and fading with the picture's crossfades
    for i in range(1, 26):
        a0, b0, pl = S[i]
        xi, xo = T.XFADE.get(i, 0) / 2, T.XFADE.get(i + 1, 0) / 2
        a, d = f(a0 - xi), f(b0 + xo - (a0 - xi))
        fi, fo = max(0.03, f(2 * xi)), max(0.03, f(2 * xo))
        bed = {"hall": lambda r, d: room_bed(r, d),
               "flat": lambda r, d: room_bed(r, d) + wind_bed(r, d, 0.4)[:, :ns(d)] * 0.25,
               "wall": lambda r, d: hum_bed(r, d, 50, 0.3) * 0.5 + room_bed(r, d)[:, :ns(d)] * 0.6,
               "kiosk": lambda r, d: street_bed(r, d),
               "station": lambda r, d: night_bed(r, d),
               "warehouse": lambda r, d: room_bed(r, d, creaks=True),
               "office": lambda r, d: office_bed(r, d),
               "island": lambda r, d: surf_bed(r, d) + widen(gulls(r, d, 0.4), r, 9, 0.8)[:, :ns(d)] * 0.4}[pl]
        lvl = {"hall": -26.0, "flat": -24.0, "wall": -27.0, "kiosk": -22.0, "station": -23.0, "warehouse": -25.0, "office": -26.0, "island": -21.0}[pl]
        add(Cue(a, f"bed: {pl}", f"shot {i} ambience", lambda r=rr(), d=d, bed=bed, fi=fi, fo=fo: (fades(bed(r, d), fi, fo), 0.0), lvl, kind="bed", send=0.0))
    # ---- 1-2 the hook: the hall cheers, a confetti pop, the neighbour faints into the heap
    add(Cue(0.0, "crowd cheer", "the hall cheering the winner", lambda r=rr(): cheer(r, f(130) + 0.4), -11.0, kind="bed", room="room", send=0.15))
    add(Cue(0.05, "confetti pop", "confetti cannon", lambda r=rr(): pop(r), -9.0, p=-0.3, room="room"))
    add(Cue(f(T.FAINT[0]), "stiff tip", "the neighbour goes rigid and tips back", lambda r=rr(): whoosh(r, 0.5, 300, 1500, 0.4), -12.0, p=0.3))
    add(Cue(f(T.FAINT[1]), "heap thud", "he lands in the confetti heap", lambda r=rr(): heap_thud(r), -7.0, p=0.35, room="room"))
    add(Cue(f(T.FAINT[1]) + 0.3, "stars", "circling stars over his head", lambda r=rr(): sparkle(r), -15.0, p=0.35))
    add(Cue(f(106), "page swish", "push-in to the page", lambda r=rr(): paper(r, 0.4, 0.6), -14.0))
    # ---- 3-5 Bucharest
    add(Cue(f(130) - 0.2, "into 1962", "the crossfade into the flat", lambda r=rr(): whoosh(r, 0.6, 200, 900, 0.5), -16.0))
    add(Cue(f(T.MOTH), "moth", "a moth flutters out of his pocket", lambda r=rr(): flutter(r, 1.0), -12.0, p=-0.2, room="room", send=0.1))
    add(Cue(f(T.PENCIL), "pencil spring", "the pencil springs up like an antenna", lambda r=rr(): spring(r, 0.6, 520), -9.0, p=0.2, room="room"))
    add(Cue(f(276), "paper", "push into the headline", lambda r=rr(): paper(r, 0.4), -14.0))
    # ---- 6 the explanation wall: cells switch on, the scale tips to the prize
    add(Cue(f(294) + 0.2, "cells on", "the wall's cells blink on", lambda r=rr(): blips(r, 1.6, 10), -16.0, room="room", send=0.12))
    add(Cue(f(T.PRIZE), "scale clank", "the scale tips to the prize", lambda r=rr(): clank(r), -8.0, p=-0.3, room="room", send=0.2))
    add(Cue(f(T.PRIZE) + 0.12, "coin chink", "coins in the prize bag", lambda r=rr(): glass(r), -14.0, p=-0.3))
    # ---- 7 "crazy": the friends laugh
    add(Cue(f(T.CRAZY) - 0.3, "friends laugh", "the friends laughing at him", lambda r=rr(): laugh(r, 3, 1.4), -10.0, room="room", send=0.12))
    add(Cue(f(T.CRAZY), "cuckoo", "a twirled finger: a little cuckoo call", lambda r=rr(): spring(r, 0.4, 880), -16.0, p=0.4))
    # ---- 8 the ticket mountain
    add(Cue(f(T.SINK), "sinking", "a friend sinks into the tickets", lambda r=rr(): avalanche(r, 1.0), -12.0, room="room"))
    # ---- 9-10 tickets by hand, the win
    add(Cue(f(T.COINS), "coins", "coins chip in to the jar", lambda r=rr(): coin(r, 1.2), -11.0, p=0.2, room="room"))
    add(Cue(f(T.COINS) + 0.35, "coins 2", "more coins", lambda r=rr(): glass(r), -14.0, p=0.25, room="room"))
    add(Cue(f(cue_s(T.W["fill"])), "pencils", "pencils scratching fast", lambda r=rr(): paper(r, 1.6, 1.8), -15.0, room="room"))
    add(Cue(f(cue_s(T.W["hand"])) - 0.6, "steam", "steam puffs from a friend's ears", lambda r=rr(): hiss(r, 0.9), -15.0, p=0.3))
    add(Cue(f(T.WIN), "win sting", "the win: a bright ding", lambda r=rr(): ding(r), -8.0, room="room"))
    add(Cue(f(T.WIN), "win cheer", "the friends cheer, hats fly", lambda r=rr(): cheer(r, 1.4, 6), -10.0, room="room", send=0.12))
    add(Cue(f(T.WIN) + 0.05, "plaque", "the WINS: 1 plaque thuds onto the wall", lambda r=rr(): thump(r, 140, 0.25), -12.0, p=-0.4))
    # ---- 11-12 Melbourne
    add(Cue(f(636) - 0.1, "into Melbourne", "crossfade swish", lambda r=rr(): whoosh(r, 0.6, 300, 1600, 0.5), -16.0))
    add(Cue(f(T.SUITCASE), "suitcase", "the suitcase hits the pavement and bounces", lambda r=rr(): thump(r, 90, 0.4), -8.0, p=-0.2))
    add(Cue(f(T.SUITCASE) + 0.25, "suitcase 2", "little bounce", lambda r=rr(): thump(r, 120, 0.2), -15.0, p=-0.2))
    add(Cue(f(T.SUITCASE) + 0.9, "tram", "a tram bell down the street", lambda r=rr(): tram_bell(r), -18.0, p=0.7))
    for k in range(4):
        add(Cue(f(T.KANGAROO) + 0.28 * k, f"hop {k + 1}", "the kangaroo hops off with his hat", lambda r=rr(): thump(r, 70, 0.25), -13.0 - 1.5 * k, p=-0.2 + 0.25 * k))
    for k, fr_ in enumerate(T.TICKS):
        add(Cue(f(fr_), f"tick {k + 2}", f"the plaque flips to {k + 2}", lambda r=rr(): tick(r, 2200), -14.0, p=0.2))
    add(Cue(f(T.GREEN), "envy", "the clerk turns green: a jealous groan", lambda r=rr(): groan(r), -11.0, p=0.1))
    # ---- 13 1992: the glint, the whip
    add(Cue(f(T.GLINT), "glint", "his glasses glint", lambda r=rr(): sparkle(r), -11.0, p=0.1))
    add(Cue(f(T.WHIPS[13]) - 0.12, "whip 1", "whip pan to Virginia", lambda r=rr(): whoosh(r, 0.35, 400, 3000, 0.35), -9.0, p=0.4))
    # ---- 14 the jackpot rolls up, the guard's jaw drops
    add(Cue(f(T.ROLL[0]), "digits roll", "the jackpot digits roll up", lambda r=rr(): ticks(r, f(T.ROLL[1] - T.ROLL[0]), 12, 40, 2600), -12.0, p=-0.2))
    add(Cue(f(T.ROLL[1]), "roll stop", "the board locks on $27,036,142", lambda r=rr(): ding(r), -10.0, p=-0.2))
    add(Cue(f(T.JAW), "jaw drop", "the guard's jaw drops", lambda r=rr(): spring(r, 0.5, 180), -10.0, p=-0.3))
    # ---- 15-16 seven million; the ticket insert
    add(Cue(f(925) + 0.2, "cells on 2", "the wall fills", lambda r=rr(): blips(r, 2.0, 18), -16.0, room="room", send=0.12))
    add(Cue(f(996), "ticket", "the ticket on the counter", lambda r=rr(): paper(r, 0.3, 0.6), -15.0))
    add(Cue(f(996) + 0.4, "coin on ticket", "a coin set down on it", lambda r=rr(): coin(r, 0.6), -14.0))
    # ---- 17 the presses
    add(Cue(f(1037) - 0.15, "presses", "the presses running", lambda r=rr(): press(r, f(1085 - 1037) + 0.3), -13.0, kind="bed", room="room", send=0.15))
    add(Cue(f(T.PRESS) + 0.35, "spit", "tickets spat into the operator's face", lambda r=rr(): paper(r, 0.8, 1.6), -10.0, p=-0.1))
    # ---- 18 the route across the map
    add(Cue(f(T.ROUTE[0]), "marker", "the route drawn across the map", lambda r=rr(): squeak(r, f(T.ROUTE[1] - T.ROUTE[0])), -14.0, p=0.1))
    add(Cue(f(T.ROUTE[0]) + 0.3, "ship horn", "a cargo ship's horn far off", lambda r=rr(): horn(r, 1.4), -16.0, p=0.3))
    # ---- 19-20 couriers, three days
    add(Cue(f(1136) - 0.2, "couriers run", "an army of couriers running", lambda r=rr(): run_crowd(r, f(1239 - 1136) + 0.3), -12.0, kind="bed", send=0.1))
    add(Cue(f(T.AVALANCHE[0]), "avalanche", "tickets bury the clerk", lambda r=rr(): avalanche(r, f(T.AVALANCHE[1] - T.AVALANCHE[0])), -11.0, p=0.3))
    add(Cue(f(T.WHIPS[19]) - 0.12, "whip 2", "whip pan into the store", lambda r=rr(): whoosh(r, 0.35, 400, 3000, 0.35), -9.0, p=-0.4))
    add(Cue(f(T.CLOCK), "clock races", "the clock races", lambda r=rr(): ticks(r, f(1280 - T.CLOCK), 8, 30, 1800), -12.0, p=-0.3, room="room"))
    for k, fr_ in enumerate(T.DAYS):
        add(Cue(f(fr_), f"day {3 - k}", "a day flips off the calendar", lambda r=rr(): paper(r, 0.25, 1.2), -14.0, p=0.3))
    # ---- 21 out of time: the courier collapses
    add(Cue(f(T.COLLAPSE), "collapse", "a courier keels over", lambda r=rr(): (mono(G.oof(r)) if np.ndim(G.oof(r)) > 1 else G.oof(r), 0.0), -10.0, p=0.2))
    add(Cue(f(T.COLLAPSE) + 0.4, "flop", "he hits the floor", lambda r=rr(): thump(r, 75, 0.35), -10.0, p=0.2, room="room"))
    # ---- 22 the winning ticket; tea
    add(Cue(f(1338) + 0.3, "golden glint", "the winning ticket glints in the pile", lambda r=rr(): sparkle(r), -9.0, room="room", send=0.15))
    add(Cue(f(cue_s(T.W["the2"])), "sip", "Stefan sips his tea", lambda r=rr(): sip(r), -12.0, p=0.3, room="room"))
    # ---- 23-24 the rules change
    add(Cue(f(T.SLAM), "binder slam", "the RULES binder slammed shut", lambda r=rr(): slam(r), -6.0, p=-0.2, room="room", send=0.15))
    add(Cue(f(T.STEAM), "steam", "an official fumes, steam from his ears", lambda r=rr(): hiss(r, 1.0), -12.0, p=0.35))
    add(Cue(f(T.STAMP), "stamp", "NEVER AGAIN stamped", lambda r=rr(): stamp_hit(r), -6.0, room="room", send=0.15))
    # ---- 25 the island
    add(Cue(f(1545) - 0.2, "into the island", "crossfade swish into the sun", lambda r=rr(): whoosh(r, 0.8, 600, 4000, 0.5), -15.0))
    add(Cue(f(1560), "hammock", "the hammock creaks", lambda r=rr(): (G.creak(0.8, r, rate0=60, rate1=90, rough=0.2, scale=0.8) * 0.6, 0.0), -16.0, p=-0.1))
    add(Cue(f(T.PARROT), "parrot", "the parrot squawks and steals his pencil", lambda r=rr(): squawk(r), -10.0, p=0.4))
    add(Cue(f(T.PARROT) + 0.5, "wings", "parrot wings flapping off", lambda r=rr(): flutter(r, 0.7), -14.0, p=0.6))
    return C


def cue_s(s):
    return T.cue(s)


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
    yard = make_ir(0.9, 81, pre=0.01, hf=1.8, early=[(0.07, 0.4, -0.5), (0.13, 0.25, 0.5)])
    room = make_ir(0.45, 82, pre=0.004, hf=1.5, early=[(0.011, 0.5, -0.6), (0.017, 0.4, 0.6), (0.026, 0.3, 0.0)])
    out += 0.5 * convolve_st(sends["yard"], yard)[:, :N] + 0.6 * convolve_st(sends["room"], room)[:, :N]
    out = hp(out, 25, 2)
    return out[:, :N], C
