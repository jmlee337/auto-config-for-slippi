export type SdCard = {
  key: string;
  reason: string;
  forwarderVersion: string;
  slippiNintendontVersion: string;
  validIsoPath: string;
};

export enum UCF {
  OFF = 1,
  UCF80 = 2,
  STEALTH80 = 3,
  UCF84 = 4,
  STEALTH84 = 5,
}

export enum Version {
  NTSC = 1,
  PAL = 2,
}

export enum Mods {
  OFF = 1,
  STEALTH = 2,
  TOURNAMENT = 3,
  FRIENDLIES = 4,
}

export enum Lag {
  OFF = 1,
  PDF = 2,
  PDFHALF = 3,
}

export enum Frozen {
  OFF = 1,
  STADIUM = 2,
  ALL = 3,
}

export enum Gameplay {
  OFF = 1,
  LGL = 2,
  WOBBLING = 3,
  BOTH = 4,
}

export enum Widescreen {
  OFF = 1,
  WIDE_TO_NARROW = 2,
  WIDE = 3,
}

export enum Safety {
  OFF = 1,
  ON = 2,
}

export enum Video {
  AUTO = 1,
  PAL60 = 3,
}

export type Config = {
  cheats: boolean;
  forceProgressive: boolean;
  autoBoot: boolean;
  video: Video;
  replays: boolean;
  ucf: UCF;
  pal: boolean;
  mods: Mods;
  lag: Lag;
  frozen: Frozen;
  gameplay: Gameplay;
  widescreen: Widescreen;
  safety: boolean;
  stealthAutoBoot: boolean;
};
