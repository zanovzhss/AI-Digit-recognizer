# Picture timeline of "The Stone That Saved a Village", mirrored (read-only) from src/videos/stone/story.ts so every
# sound lands on its frame. Any later timing change in story.ts means re-running mix.py.
import json
import math
import os
import wave

FPS = 30
_v = wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "voice", "voice.wav"), "rb")
VOICE_N, VOICE_SR = _v.getnframes(), _v.getframerate()
_v.close()
DUR = VOICE_N / VOICE_SR       # exact length of voice.wav (54.19 s); the mix is exactly this long at 48 kHz
TOTAL = round(DUR * FPS)       # 1626 frames
fr = lambda f: f / FPS
cue = lambda s: math.floor(s * FPS + 0.5) - 2   # = story.ts cue(): picture events land 2 frames before the word

W = dict(do=3.52, below=4.6, you=5.87, y1896=6.54, giant=7.74, wave=8.12, wiped=8.48, aneyoshi=9.74, only=10.7, two=10.92, survived=11.52,
         then=13.34, y1933=14.04, happened=15.34, again=15.56, four=16.58, so=17.82, carve=18.54, warning=19.04, set=19.5, high=19.78,
         hillside=20.34, over=21.22, eighty=21.86, coast=22.68, towns=23.74, grow=24.04, water=25.04, boats=26.18, jobs=26.96, view=27.84,
         all_=28.52, forgotten=30.58, just=31.34, rocks=31.86, grass=32.38, but=33.12, eleven=33.8, houses=35.04, hill=35.78, walk=36.32,
         boats2=37.02, then2=37.88, y2011=38.5, ground=39.52, shaking=40.1, the=40.92, strongest=41.06, earthquake=41.5, history=42.92,
         sends=43.42, wave2=44.04, swallows=44.42, towns2=45.2, coast2=46.06, it=46.74, roars=46.88, valley=47.58, aneyoshi2=48.08,
         and_=49.02, stops=49.14, three=50.02, feet=50.42, below2=50.66, stone=51.26, every=51.97, single=52.3, house=52.6, still=53.26,
         standing=53.56)

B = [0, 194, 319, 350, 398, 458, 533, 583, 635, 756, 805, 854, 938, 992, 1088, 1134, 1182, 1228, 1329, 1400, 1469, 1557, TOTAL]
PLACE = ["hill_golden", "storm", "storm", "storm", "storm", "storm", "lantern", "lantern", "town", "harbour", "market", "corner", "corner",
         "dawn", "dawn", "room", "room", "map", "wave", "valley", "valley", "sunset"]
SHOTS = {i + 1: (B[i], B[i + 1], PLACE[i]) for i in range(22)}
XFADE = {2: 12, 3: 12, 5: 12, 7: 10, 8: 8, 9: 14, 12: 12, 14: 12, 15: 8, 16: 10, 18: 12, 19: 10, 22: 12}
WHIPS = {19: 1400}             # the one whip (the boundary frame)

# story actions (frames) = story.ts / cast.ts / world.ts
REVEAL = cue(W["do"])                  # the crane up off the carved face
PUSH_1896 = None                       # (removed: shot 1 now ends on the high view, a clean crossfade)
SWELL = (206, 319)                     # the 1896 wave wall rises far out and rolls in at the village
FLOOD_1933 = (460, 520)                # the 1933 surge sweeps in between the houses
TAP_PERIOD = 14                        # carving: one hammer tap every 14 frames from frame 533
HAUL = (583, 635)
GULL = cue(W["view"])
SHAKE = cue(W["ground"])
RINGS = cue(W["earthquake"])
WAVE_LINE = cue(W["sends"])
TOWN_WAVE = (1318, 1402)
CLIMB = (1396, 1469)
STOP = (1462, 1498)
END_CHORD = cue(W["still"])


def words(path):
    return json.load(open(path, encoding="utf-8"))
