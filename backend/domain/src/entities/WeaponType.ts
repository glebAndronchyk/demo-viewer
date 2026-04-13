export type WeaponType =
  // Pistols
  | "P2000"
  | "Glock-18"
  | "P250"
  | "Desert Eagle"
  | "Five-SeveN"
  | "Dual Berettas"
  | "Tec-9"
  | "CZ75 Auto"
  | "USP-S"
  | "R8 Revolver"
  // SMGs
  | "MP7"
  | "MP9"
  | "PP-Bizon"
  | "MAC-10"
  | "UMP-45"
  | "P90"
  | "MP5-SD"
  // Shotguns / LMGs
  | "Sawed-Off"
  | "Nova"
  | "MAG-7"
  | "XM1014"
  | "M249"
  | "Negev"
  // Rifles
  | "Galil AR"
  | "FAMAS"
  | "AK-47"
  | "M4A4"
  | "M4A1"
  | "SSG 08"
  | "SG 553"
  | "AUG"
  | "AWP"
  | "SCAR-20"
  | "G3SG1"
  // Equipment
  | "Zeus x27"
  | "Kevlar Vest"
  | "Kevlar + Helmet"
  | "C4"
  | "Knife"
  | "Defuse Kit"
  | "World"
  // Grenades
  | "Decoy Grenade"
  | "Molotov"
  | "Incendiary Grenade"
  | "Flashbang"
  | "Smoke Grenade"
  | "HE Grenade"
  // Other
  | "UNKNOWN";

export const grenades = [
  "HE Grenade",
  "Decoy Grenade",
  "Incendiary Grenade",
  "Flashbang",
  "Molotov",
  "Smoke Grenade",
] satisfies WeaponType[];

export type GrenadesWeaponType = (typeof grenades)[number];
