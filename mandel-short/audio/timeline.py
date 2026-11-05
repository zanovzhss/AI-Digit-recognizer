# Picture timeline of "The Man Who Won the Lottery 14 Times", mirrored (read-only) from src/videos/mandel/story.ts so
# every sound lands on its frame. Any later timing change in story.ts means re-running mix.py.
import json
import math
import os
import wave

FPS = 30
_v = wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "voice", "voice.wav"), "rb")
VOICE_N, VOICE_SR = _v.getnframes(), _v.getframerate()
_v.close()
DUR = VOICE_N / VOICE_SR       # exact length of voice.wav (53.94 s); the mix is exactly this long at 48 kHz
TOTAL = round(DUR * FPS)       # 1618 frames
fr = lambda f: f / FPS
cue = lambda s: math.floor(s * FPS + 0.5) - 2   # = story.ts cue(): reactions land 2 frames before the word

W = dict(never=2.24, lucky=3.08, you=3.89, and1=5.64, broke=6.56, when=7.9, weird=8.98, if_=9.88, prize=13.82, everyone=14.6, crazy=15.36,
         youd=15.94, millions=16.24, so=17.58, chip=18.08, fill=18.8, hand=19.62, and2=20.26, win=20.62, he=21.34, again=22.72,
         and3=23.36, again2=23.52, twelve=24.28, then=25.4, y1992=25.92, target=27.66, the=28.06, hits=29.24, twentyseven=29.46,
         and4=30.92, seven=31.56, tickets=33.28, one=33.72, he2=34.62, prints=34.78, ships=36.2, and5=37.88, couriers=39.06,
         gas=39.6, they=41.32, three=41.64, they2=42.7, run=42.82, all_=44.02, doesnt=44.64, the2=45.28, winning=45.5, pile=46.78,
         so2=47.4, changed=48.64, rules=49.2, so3=49.62, ever=50.34, again3=50.92, and6=51.54, he3=52.3, retired=52.4, island=53.3)

B = [0, 106, 130, 168, 235, 294, 418, 475, 525, 606, 636, 699, 760, 840, 925, 996, 1037, 1085, 1136, 1239, 1280, 1338, 1420, 1487, 1545, TOTAL]
PLACE = ["hall", "hall", "flat", "flat", "flat", "wall", "flat", "wall", "flat", "flat", "kiosk", "kiosk", "wall", "station", "wall", "station",
         "warehouse", "wall", "station", "station", "wall", "warehouse", "office", "office", "island"]
SHOTS = {i + 1: (B[i], B[i + 1], PLACE[i]) for i in range(25)}
XFADE = {3: 12, 4: 8, 6: 10, 7: 10, 8: 8, 9: 10, 11: 12, 13: 12, 15: 10, 16: 10, 17: 10, 18: 12, 19: 12, 21: 8, 22: 10, 23: 10, 25: 12}
WHIPS = {13: 840, 19: 1239}    # the two whip pans (the boundary frame)
INDOOR = {"hall", "flat", "wall", "warehouse", "office"}

# story actions (frames) = story.ts / cast.ts / world.ts
FAINT = (cue(W["never"]) - 4, cue(W["never"]) + 14)
MOTH = cue(W["broke"])
PENCIL = cue(W["weird"])
PRIZE = cue(W["prize"]) - 6                    # the scale tips to the prize
CRAZY = cue(W["crazy"])
SINK = 482
COINS = cue(W["chip"])
WIN = cue(W["win"])
SUITCASE = 656                                 # the suitcase hits the pavement (falls from frame 640 over 16 f)
KANGAROO = 664
TICKS = [700 + round(4.5 * k) for k in range(1, 13)]   # the WINS plaque ticking 2 -> 13
GREEN = cue(W["twelve"])
GLINT = cue(W["target"])
ROLL = (cue(W["hits"]) - 4, cue(W["hits"]) + 22)
JAW = cue(W["twentyseven"]) + 6
PRESS = cue(W["prints"])
ROUTE = (1088, 1132)
AVALANCHE = (1170, 1220)
CLOCK = 1239
DAYS = [1246 + 9 * k for k in range(1, 4)]
COLLAPSE = cue(W["run"]) + 6
SLAM = cue(W["changed"]) - 4
STEAM = cue(W["rules"]) - 4
STAMP = cue(W["ever"])
PARROT = cue(W["retired"]) + 12


def words(path):
    return json.load(open(path, encoding="utf-8"))
