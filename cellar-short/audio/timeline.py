# Picture timeline of "The Warm Bucket", mirrored (read-only) from src/videos/cellar/story.ts so every sound lands on
# its frame. Lock these before rendering sound: any later timing change in story.ts means re-running mix.py.
import json
import math

FPS = 30
TOTAL = 210
DUR = TOTAL / FPS            # 7.000 s exactly
fr = lambda f: f / FPS

W = dict(bucket=0.503, water=0.991, cellar=1.629, so=2.036, potatoes=2.361, freeze=3.231, Freezing=3.777, water2=4.172,
         heat=4.973, just=5.472, enough=5.762, save=6.192, them=6.505)
cue = lambda s: round(s * FPS) - 2          # story.ts cue(): reactions land 2 frames before the word

SHOTS = {1: (0, 60, "street"), 2: (60, 120, "cellar"), 3: (120, 175, "cellar"), 4: (175, TOTAL, "cellar")}
CUT_CELLAR = fr(60)

# walk (story.ts WALK / walkU / walkPhase)
WALK_A, WALK_B = (-3.2, 2.6), (-4.1, 4.9)
WALK_F1 = cue(W["cellar"]) - 4
WALK_LEN = math.hypot(WALK_B[0] - WALK_A[0], WALK_B[1] - WALK_A[1])


def walk_u(f):
    u = min(1.0, max(0.0, f / WALK_F1))
    return u * 0.9 if u < 0.7 else 0.63 + 0.37 * (1 - (1 - (u - 0.7) / 0.3) ** 2)


def footfalls():
    """times (s) the farmer's feet land in the snow: walk phase crosses 0 / 0.5 (front card contact), + the stop"""
    out, prev = [], 0.0
    for k in range(1, int(WALK_F1 * 20) + 1):
        f = k / 20
        c = walk_u(f) * WALK_LEN / 1.6 * 2      # half-cycles walked
        if math.floor(c) > math.floor(prev):
            out.append(fr(f))
        prev = c
    out.append(fr(WALK_F1 + 1))                  # the closing step as he stops
    return out


HATCH_OPEN = (cue(W["cellar"]) - 2, cue(W["cellar"]) + 9)     # door swings up (frames)
SETDOWN_LAND = cue(W["potatoes"])                             # bucket on the floor (frame)
ICE = (120, cue(W["heat"]) + 2)                               # crystals spread (frames)
GLOW0 = cue(W["heat"])                                        # warm wisps rise
MELT = (cue(W["just"]), cue(W["enough"]) + 8)                 # frost melts
NOD = cue(W["save"])                                          # nod + camera kick
GLIDE = (6, 46)                                               # shot 1 rooftop -> eye level glide (frames)


def words(path):
    return json.load(open(path, encoding="utf-8"))
