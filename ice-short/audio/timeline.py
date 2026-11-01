# Picture timeline of "The Man Who Sold Ice to the Tropics", mirrored (read-only) from src/videos/ice/story.ts so every
# sound lands on its frame. Lock these before rendering sound: any later timing change in story.ts means re-running mix.py.
import json
import math
import os
import wave

FPS = 30
_v = wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "voice", "voice.wav"), "rb")
VOICE_N, VOICE_SR = _v.getnframes(), _v.getframerate()
_v.close()
DUR = VOICE_N / VOICE_SR       # exact length of voice.wav (55.1706 s); the mix is exactly this long at 48 kHz
TOTAL = round(DUR * FPS)       # 1655 frames
fr = lambda f: f / FPS
cue = lambda s: math.floor(s * FPS + 0.5) - 2   # = story.ts cue() (JS Math.round): reactions land 2 frames before the word

W = dict(never=1.97, you=3.63, and1=5.48, loaded=6.99, ship=7.33, headed=9.82, the=11.11, newspaper=11.24, joke=12.28,
         prove=13.64, slippery=13.97, it=15.78, melts=17.46, and2=19.32, dollars=21.21, so=22.08, and3=23.7, again2=23.97,
         by=25.2, prison=27.24, and4=27.93, figures=28.78, ice=29.86, it2=31.73, warm=33.11, ever=34.15, wrapped=34.33,
         the2=36.12, heat=37.99, so2=38.82, which=40.73, in_=43.1, ships=44.42, eighty=45.41, of=46.04, india=46.51,
         a=47.32, hundred=47.4, arrive=48.3, and5=49.08, city=50.4, bought=52.32, man=53.45, laughed=54.35)

B = [0, cue(W["never"]), cue(W["you"]), cue(W["and1"]), cue(W["loaded"]), cue(W["headed"]), cue(W["the"]), cue(W["joke"]), cue(W["prove"]),
     cue(W["it"]), cue(W["melts"]), cue(W["and2"]), cue(W["so"]), cue(W["and3"]), 736, cue(W["by"]), cue(W["and4"]), cue(W["ice"]), cue(W["it2"]),
     cue(W["ever"]), cue(W["the2"]), cue(W["so2"]), cue(W["which"]), cue(W["in_"]), cue(W["ships"]), cue(W["a"]), cue(W["and5"]), cue(W["city"]),
     cue(W["man"]), TOTAL]
PLACE = ["beach", "beach", "pond", "harbor", "harbor", "harbor", "street", "harbor", "street", "port", "port", "port", "harbor", "harbor",
         "port", "cell", "cell", "cell", "cell", "cell", "cell", "hold", "mill", "ocean", "hold", "calcutta", "calcutta", "calcutta", "calcutta"]
SHOTS = {i + 1: (B[i], B[i + 1], PLACE[i]) for i in range(29)}
FLASH = B[2]

# story actions (frames)
CARRY_LAND = [208 + 62, 208 + 26 + 62]          # carriers set their blocks down on deck
SLIP = cue(W["slippery"])
WALLET_OPEN = (582, 600)
COIN = cue(W["dollars"])
YAWN = (cue(W["prison"]) - 6, cue(W["prison"]) + 26)
BULB = cue(W["figures"])
WRAP = (cue(W["wrapped"]), cue(W["wrapped"]) + 22)
HEAT = cue(W["heat"])
FLIPS = [1342, cue(W["eighty"]) + 2, cue(W["of"]), cue(W["india"])]
HATCH = (cue(W["hundred"]) + 2, cue(W["hundred"]) + 20)


def words(path):
    return json.load(open(path, encoding="utf-8"))
