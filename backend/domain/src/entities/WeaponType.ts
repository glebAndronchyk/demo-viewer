import type { PlayerState } from "./DemoChunkEntity.ts";
import { ItemPickupEvent } from "./events";

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

export class Weapon {
  // Pistols
  static readonly P2000: WeaponType = "P2000";
  static readonly GLOCK_18: WeaponType = "Glock-18";
  static readonly P250: WeaponType = "P250";
  static readonly DESERT_EAGLE: WeaponType = "Desert Eagle";
  static readonly FIVE_SEVEN: WeaponType = "Five-SeveN";
  static readonly DUAL_BERETTAS: WeaponType = "Dual Berettas";
  static readonly TEC_9: WeaponType = "Tec-9";
  static readonly CZ75_AUTO: WeaponType = "CZ75 Auto";
  static readonly USP_S: WeaponType = "USP-S";
  static readonly R8_REVOLVER: WeaponType = "R8 Revolver";

  // SMGs
  static readonly MP7: WeaponType = "MP7";
  static readonly MP9: WeaponType = "MP9";
  static readonly PP_BIZON: WeaponType = "PP-Bizon";
  static readonly MAC_10: WeaponType = "MAC-10";
  static readonly UMP_45: WeaponType = "UMP-45";
  static readonly P90: WeaponType = "P90";
  static readonly MP5_SD: WeaponType = "MP5-SD";

  // Shotguns
  static readonly SAWED_OFF: WeaponType = "Sawed-Off";
  static readonly NOVA: WeaponType = "Nova";
  static readonly MAG_7: WeaponType = "MAG-7";
  static readonly XM1014: WeaponType = "XM1014";

  // Machine guns
  static readonly M249: WeaponType = "M249";
  static readonly NEGEV: WeaponType = "Negev";

  // Assault rifles
  static readonly GALIL_AR: WeaponType = "Galil AR";
  static readonly FAMAS: WeaponType = "FAMAS";
  static readonly AK_47: WeaponType = "AK-47";
  static readonly M4A4: WeaponType = "M4A4";
  static readonly M4A1: WeaponType = "M4A1";
  static readonly SG_553: WeaponType = "SG 553";
  static readonly AUG: WeaponType = "AUG";

  // Sniper rifles
  static readonly SSG_08: WeaponType = "SSG 08";
  static readonly AWP: WeaponType = "AWP";
  static readonly SCAR_20: WeaponType = "SCAR-20";
  static readonly G3SG1: WeaponType = "G3SG1";

  // Equipment
  static readonly ZEUS_X27: WeaponType = "Zeus x27";
  static readonly KEVLAR_VEST: WeaponType = "Kevlar Vest";
  static readonly KEVLAR_HELMET: WeaponType = "Kevlar + Helmet";
  static readonly C4: WeaponType = "C4";
  static readonly KNIFE: WeaponType = "Knife";
  static readonly DEFUSE_KIT: WeaponType = "Defuse Kit";
  static readonly WORLD: WeaponType = "World";

  // Grenades
  static readonly DECOY_GRENADE: WeaponType = "Decoy Grenade";
  static readonly MOLOTOV: WeaponType = "Molotov";
  static readonly INCENDIARY_GRENADE: WeaponType = "Incendiary Grenade";
  static readonly FLASHBANG: WeaponType = "Flashbang";
  static readonly SMOKE_GRENADE: WeaponType = "Smoke Grenade";
  static readonly HE_GRENADE: WeaponType = "HE Grenade";

  // Other
  static readonly UNKNOWN: WeaponType = "UNKNOWN";

  // Categories
  static readonly pistols = [
    Weapon.P2000,
    Weapon.GLOCK_18,
    Weapon.P250,
    Weapon.DESERT_EAGLE,
    Weapon.FIVE_SEVEN,
    Weapon.DUAL_BERETTAS,
    Weapon.TEC_9,
    Weapon.CZ75_AUTO,
    Weapon.USP_S,
    Weapon.R8_REVOLVER,
  ];

  static readonly smgs = [
    Weapon.MP7,
    Weapon.MP9,
    Weapon.PP_BIZON,
    Weapon.MAC_10,
    Weapon.UMP_45,
    Weapon.P90,
    Weapon.MP5_SD,
  ];

  static readonly shotguns = [
    Weapon.SAWED_OFF,
    Weapon.NOVA,
    Weapon.MAG_7,
    Weapon.XM1014,
  ];

  static readonly machineGuns = [Weapon.M249, Weapon.NEGEV];

  static readonly assaultRifles = [
    Weapon.GALIL_AR,
    Weapon.FAMAS,
    Weapon.AK_47,
    Weapon.M4A4,
    Weapon.M4A1,
    Weapon.SG_553,
    Weapon.AUG,
  ];

  static readonly sniperRifles = [
    Weapon.SSG_08,
    Weapon.AWP,
    Weapon.SCAR_20,
    Weapon.G3SG1,
  ];

  static readonly meleeAndEquipment = [Weapon.ZEUS_X27, Weapon.KNIFE];

  static readonly grenades = [
    Weapon.HE_GRENADE,
    Weapon.DECOY_GRENADE,
    Weapon.INCENDIARY_GRENADE,
    Weapon.FLASHBANG,
    Weapon.MOLOTOV,
    Weapon.SMOKE_GRENADE,
  ];

  // Prices
  static readonly prices: Record<WeaponType, number> = {
    // Pistols
    P2000: 200,
    "Glock-18": 200,
    P250: 300,
    "Desert Eagle": 700,
    "Five-SeveN": 500,
    "Dual Berettas": 400,
    "Tec-9": 500,
    "CZ75 Auto": 500,
    "USP-S": 200,
    "R8 Revolver": 600,
    // SMGs
    MP7: 1500,
    MP9: 1250,
    "PP-Bizon": 1400,
    "MAC-10": 1050,
    "UMP-45": 1200,
    P90: 2350,
    "MP5-SD": 1500,
    // Shotguns
    "Sawed-Off": 1100,
    Nova: 1050,
    "MAG-7": 1300,
    XM1014: 2000,
    // Machine guns
    M249: 5200,
    Negev: 1700,
    // Rifles
    "Galil AR": 1800,
    FAMAS: 2050,
    "AK-47": 2700,
    M4A4: 3100,
    M4A1: 2900,
    "SSG 08": 1700,
    "SG 553": 3000,
    AUG: 3300,
    AWP: 4750,
    "SCAR-20": 5000,
    G3SG1: 5000,
    // Equipment
    "Zeus x27": 200,
    "Kevlar Vest": 650,
    "Kevlar + Helmet": 1000,
    "Defuse Kit": 400,
    // Grenades
    "HE Grenade": 300,
    Flashbang: 200,
    "Smoke Grenade": 300,
    Molotov: 400,
    "Incendiary Grenade": 600,
    "Decoy Grenade": 50,
    // Free / non-purchasable
    C4: 0,
    Knife: 0,
    World: 0,
    UNKNOWN: 0,
  };

  // Methods

  static getTotalPlayerEquipmentPrices(player: PlayerState) {
    const equipment = [
      ...player.currentEquipment.weapons,
      ...player.currentEquipment.grenades,
    ] as WeaponType[];

    return equipment.reduce((acc, curr) => {
      const price = this.prices[curr] || 0;

      return acc + price;
    }, 0);
  }

  static getItemPickupEventPrice(e: ItemPickupEvent) {
    return this.prices[e.weapon];
  }
}
