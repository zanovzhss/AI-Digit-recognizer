# Every sound effect + ambience bed of "The Man Who Sold Ice to the Tropics" as a cue list timed to the picture
# (timeline.py), rendered into one stereo SFX stem (all synthesized here on the template's dsp / sfx_gen). Levels follow
# the user's standard mix (as the bridge template): each EVENT has a "naive" level (LU relative to the voice stem, max
# momentary loudness) and is placed SFX_DB = -6 dB under it; ambience BEDS (integrated loudness) are not reduced.
# Outdoor sounds get the open-air yard reverb, the cell and the hold a small wooden / stone room.
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
def cues():
    C = []
    R = rng(1806)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append
    f = T.fr
    S = T.SHOTS
    sa = lambda i: f(S[i][0])
    sd = lambda i: f(S[i][1] - S[i][0])
    # ---- beds: one per shot, hard cuts with the picture
    for i in range(1, 30):
        pl, a, d = S[i][2], sa(i), sd(i)
        room = "room" if pl in INDOOR else "yard"
        if pl == "beach":
            add(Cue(a, "surf", "waves on the beach + gulls", lambda r=rr(), d=d: (surf_bed(r, d) + widen(gulls(r, d, 0.5), r, 9, 0.8) * 0.4, 0.0), -22.0, kind="bed", send=0.0))
        elif pl == "pond":
            add(Cue(a, "winter wind", "cold wind over the frozen pond", lambda r=rr(), d=d: (wind_bed(r, d), 0.0), -24.0, kind="bed", send=0.0))
        elif pl in ("harbor", "street"):
            add(Cue(a, "harbour (winter)", "water slapping the quay, wind, gulls" if pl == "harbor" else "street wind",
                    (lambda r=rr(), d=d: (harbor_bed(r, d), 0.0)) if pl == "harbor" else (lambda r=rr(), d=d: (wind_bed(r, d, 0.4), 0.0)), -23.0, kind="bed", send=0.0))
        elif pl == "port":
            add(Cue(a, "harbour (tropics)", "lapping water, warm breeze, insects, gulls", lambda r=rr(), d=d: (harbor_bed(r, d, warm=True), 0.0), -23.0, kind="bed", send=0.0))
        elif pl == "cell":
            add(Cue(a, "cell room", "stone room tone, air through the window", lambda r=rr(), d=d: (room_bed(r, d), 0.0), -27.0, kind="bed", send=0.0, room="room"))
        elif pl == "hold":
            add(Cue(a, "hold", "inside the hold: room tone + hull creaks", lambda r=rr(), d=d: (room_bed(r, d, creaks=True), 0.0), -25.0, kind="bed", send=0.0, room="room"))
        elif pl == "mill":
            add(Cue(a, "mill yard", "birds, breeze, a distant saw", lambda r=rr(), d=d: (mill_bed(r, d), 0.0), -23.0, kind="bed", send=0.0))
        elif pl == "ocean":
            add(Cue(a, "open sea", "waves and wind at sea", lambda r=rr(), d=d: (surf_bed(r, d, 1.3) + wind_bed(r, d, 0.8) * 0.6, 0.0), -21.0, kind="bed", send=0.0))
        elif pl == "calcutta":
            if i == 26:
                add(Cue(a, "harbour (Calcutta)", "river water, warm breeze, gulls", lambda r=rr(), d=d: (harbor_bed(r, d, warm=True), 0.0), -23.0, kind="bed", send=0.0))
            elif i == 27:
                d3 = f(T.TOTAL) - a
                add(Cue(a, "market", "the ice market's crowd + clinks", lambda r=rr(), d=d3: (market_bed(r, d), 0.0), -21.0, kind="bed", send=0.0))
        _ = room
    # ---- shot 1-2: the hook
    add(Cue(0.0, "glide whoosh", "fast glide in over the sand", lambda r=rr(): whoosh(r, 1.1, 300, 1800, 0.45), -13.0, p=0.1))
    for k, ts in enumerate([0.9, 1.6, 2.3, 2.95, 3.4]):
        add(Cue(ts, "plip", "a drop of sweat / melt water", lambda r=rr(): plip(r), -14.0, p=-0.2 + 0.1 * k, send=0.05))
    add(Cue(f(T.FLASH) - 0.05, "flash shimmer", "white flash into 1806", lambda r=rr(): shimmer(r), -10.0, send=0.15))
    # ---- shot 3: ice saws
    for k in range(3):
        add(Cue(sa(3), "ice saw", f"cutter {k + 1} saws the pond ice", lambda r=rr(), k=k: ice_saw(r, sd(3), 1.5, k * 2.1), -8.0, p=-0.4 + 0.4 * k, send=0.1))
    # ---- shots 4-6: Boston harbour, loading, departure
    add(Cue(sa(4) + 0.2, "ship bell", "the brig's bell", lambda r=rr(): bell(r, 2), -9.0, p=0.3, send=0.2))
    for k in range(9):
        add(Cue(sa(5) + 0.15 + k * 0.33, "plank step", "boots on the gangplank", lambda r=rr(): wood_step(r), -12.0, p=0.0, send=0.1))
    for fl in T.CARRY_LAND:
        if fl < T.SHOTS[5][1]:
            add(Cue(f(fl), "block thunk", "an ice block set down on deck", lambda r=rr(): thunk(r), -4.0, p=-0.1, send=0.15))
    add(Cue(sa(6), "sail flap", "sails fill as the brig leaves", lambda r=rr(): sail_flap(r), -10.0, p=0.2, send=0.2))
    add(Cue(sa(6) + 0.1, "creak", "hull creak", lambda r=rr(): creak_ship(r), -12.0, p=-0.2, send=0.2))
    # ---- shots 7-9: the paper, the laugh, the slip
    add(Cue(sa(7), "newspaper", "the newsboy shakes the paper", lambda r=rr(): paper(r, 0.5), -8.0, p=0.0, send=0.1))
    add(Cue(f(T.cue(T.W["joke"])), "crowd laughter", "the harbour crowd laughs and points", lambda r=rr(): laugh(r, 6, 1.6), -4.0, p=-0.2, send=0.2))
    for k, ts in enumerate([f(404), f(409), f(414)]):
        add(Cue(ts, "snow step", "footstep on the packed snow", lambda r=rr(): snow_step(r), -9.0, p=0.0, send=0.08))
    add(Cue(f(T.SLIP), "slip", "skid on the ice patch, thump, 'oof', stars", lambda r=rr(): slip(r), -2.0, p=0.1, send=0.15))
    add(Cue(f(T.SLIP) + 0.55, "laughter", "the newsboy and a passer-by laugh", lambda r=rr(): laugh(r, 2, 1.0), -9.0, p=-0.3, send=0.2))
    # ---- shots 10-12: the melt, the wallet, the coin
    add(Cue(sa(10) + 0.1, "ship bell", "the brig's bell in the hot port", lambda r=rr(): bell(r, 1), -12.0, p=-0.3, send=0.25))
    add(Cue(sa(10), "drips", "the stack dripping", lambda r=rr(): drips(r, sd(10) + sd(11), 5), -12.0, p=-0.2, send=0.1))
    add(Cue(f(T.WALLET_OPEN[0]), "wallet", "the wallet flap opens: empty", lambda r=rr(): leather(r), -10.0, p=0.1, send=0.05))
    add(Cue(f(T.COIN), "coin roll", "the last coin drops out and rolls away (on 'dollars')", lambda r=rr(): coin(r, f(T.SHOTS[12][1] - T.COIN) + 0.2), -5.0, p=0.25, send=0.1))
    # ---- shots 13-15: again and again
    for i in (13, 14):
        add(Cue(sa(i), "ship bell", "the bell as the brig leaves again", lambda r=rr(): bell(r, 2), -10.0, p=0.2 if i == 13 else -0.2, send=0.2))
        add(Cue(sa(i) + 0.05, "sail flap", "sails fill", lambda r=rr(): sail_flap(r), -11.0, p=0.0, send=0.2))
    add(Cue(sa(15), "drips", "bigger puddles", lambda r=rr(): drips(r, sd(15), 9), -11.0, p=0.0, send=0.1))
    # ---- shots 16-21: the cell
    add(Cue(sa(16), "cell door", "the cell door slams, a key turns", lambda r=rr(): cell_door(r), -1.0, p=0.2, room="room", send=0.35))
    add(Cue(f(T.YAWN[0]), "yawn", "the guard's long yawn (on 'prison')", lambda r=rr(): yawn(r), -6.0, p=0.25, room="room", send=0.25))
    add(Cue(f(T.BULB), "idea ding", "the light-bulb moment (on 'figures')", lambda r=rr(): ding(r), -6.0, p=-0.1, room="room", send=0.2))
    add(Cue(sa(18), "icicle drips", "the icicle melting in the window", lambda r=rr(): drips(r, sd(18), 4), -10.0, p=0.2, room="room", send=0.2))
    add(Cue(sa(19), "warm air", "warm air drifting in through the window", lambda r=rr(): warm_swell(r, 1.8), -11.0, p=0.3, room="room", send=0.2))
    add(Cue(f(T.WRAP[0]), "towel", "the towel wrapped around the bottle (on 'wrapped')", lambda r=rr(): cloth(r), -7.0, p=0.0, room="room", send=0.15))
    add(Cue(sa(21), "warm air", "warm air drifting toward the towel", lambda r=rr(): warm_swell(r, 1.6), -12.0, p=0.0, room="room", send=0.2))
    add(Cue(f(T.HEAT), "bounce", "the warm air bounces off the towel (on 'heat')", lambda r=rr(): boing(r), -9.0, p=0.0, room="room", send=0.15))
    # ---- shots 22-23: sawdust
    for k in range(4):
        add(Cue(sa(22) + 0.05 + k * 0.55, "shovel", "shovel into sawdust, the throw, patter", lambda r=rr(): shovel(r), -7.0, p=-0.3 + 0.2 * k, room="room", send=0.2))
    for k in range(3):
        add(Cue(sa(23) + 0.4 + k * 1.1, "shovel", "sawdust thrown onto the heap", lambda r=rr(): shovel(r), -10.0, p=-0.3, send=0.1))
    # ---- shots 24-25: the voyage, the calendar
    add(Cue(sa(24), "creak", "the brig's hull working in the swell", lambda r=rr(): creak_ship(r), -10.0, p=0.0, send=0.2))
    add(Cue(sa(24) + 0.1, "sail flap", "sails full of wind", lambda r=rr(): sail_flap(r), -12.0, p=0.2, send=0.2))
    for fl in T.FLIPS:
        add(Cue(f(fl), "page flip", "a calendar month flips over", lambda r=rr(): paper(r, 0.3, 1.4), -6.0, p=-0.1, room="room", send=0.15))
    # ---- shots 26-29: Calcutta
    add(Cue(sa(26), "ship bell", "the brig's bell in Calcutta", lambda r=rr(): bell(r, 2), -11.0, p=-0.3, send=0.25))
    add(Cue(f(T.HATCH[0]), "hatch", "the hatch cover lifted off and set down", lambda r=rr(): hatch(r), -5.0, p=0.1, send=0.15))
    add(Cue(f(T.HATCH[1]) - 0.1, "ice sparkle", "the ice is still frozen under the sawdust", lambda r=rr(): sparkle(r), -9.0, p=0.0, send=0.25))
    for k, ts in enumerate([sa(28) + 0.2, sa(28) + 1.3, sa(28) + 2.2, sa(29) + 0.3]):
        add(Cue(ts, "clink", "ice and glasses at the stall", lambda r=rr(): glass(r), -10.0, p=-0.2 + 0.15 * k, send=0.15))
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
    yard = make_ir(0.9, 81, pre=0.01, hf=1.8, early=[(0.07, 0.4, -0.5), (0.13, 0.25, 0.5)])
    room = make_ir(0.45, 82, pre=0.004, hf=1.5, early=[(0.011, 0.5, -0.6), (0.017, 0.4, 0.6), (0.026, 0.3, 0.0)])
    out += 0.5 * convolve_st(sends["yard"], yard)[:, :N] + 0.6 * convolve_st(sends["room"], room)[:, :N]
    out = hp(out, 25, 2)
    return out[:, :N], C
