import React from "react";
import { Composition } from "remotion";
import { CellarShort, CELLAR_FRAMES } from "./videos/cellar/Bridge";
import { IceShort, ICE_FRAMES } from "./videos/ice/Bridge";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CellarShort" component={CellarShort} durationInFrames={CELLAR_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="IceShort" component={IceShort} durationInFrames={ICE_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
