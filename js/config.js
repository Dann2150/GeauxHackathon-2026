// Shared constants: screen size, timing, palette and stat definitions.

export const W = 1000;
export const H = 700;
export const HOUR_SEC = 22; // real seconds per in-game hour (12 hours = 4m24s)
export const HOURS = 12;

export const BG = "#120a07";
export const PANEL = "#1d120d";
export const EDGE = "#5a3320";
export const TXT = "#f2c9a0";
export const DIM = "#8a6a55";
export const OK = "#4ade80";
export const WARN = "#fbbf24";
export const BAD = "#ef4444";
export const ACC = "#ff7a3c";

export const TABS = ["HABITAT", "POWER", "LIFE SUPPORT", "SUIT", "COMMS"];
export const STAT_ORDER = ["OXYGEN", "POWER", "PRESSURE", "HEAT", "SUIT", "RADIATION"];
export const DEATH_CAUSE = {
  OXYGEN: "You suffocated. The air simply ran out.",
  PRESSURE: "The habitat decompressed. It was over quickly.",
  HEAT: "The cold took you. Mars is not forgiving.",
  SUIT: "Your suit failed. Nothing between you and the atmosphere.",
  RADIATION: "You absorbed a lethal radiation dose.",
};
