/**
 * Bitfield encoding/decoding utilities for ecoNEXT schedules.
 *
 * Schedule format:
 * - Each schedule parameter is a uint32 bitfield
 * - Each bit represents one 30-minute time slot
 * - 24 bits used per period (12 hours x 2 slots/hour)
 * - AM period: bits 0-23 = 00:00-11:30
 * - PM period: bits 0-23 = 12:00-23:30
 */

/**
 * Decode a bitfield into an array of 24 boolean slot values.
 * @param value - uint32 bitfield value
 * @returns Array of 24 booleans, true = slot active
 */
export function decodeBitfield(value: number): boolean[] {
  const slots: boolean[] = [];
  for (let bit = 0; bit < 24; bit++) {
    slots.push(((value >>> bit) & 1) === 1);
  }
  return slots;
}

/**
 * Encode an array of 24 boolean slot values into a bitfield.
 * @param slots - Array of 24 booleans
 * @returns uint32 bitfield value
 */
export function encodeBitfield(slots: boolean[]): number {
  let value = 0;
  for (let bit = 0; bit < 24; bit++) {
    if (slots[bit]) {
      value |= 1 << bit;
    }
  }
  // Convert to unsigned 32-bit integer
  return value >>> 0;
}

/**
 * Toggle a single bit in a bitfield.
 * @param value - Current bitfield value
 * @param bit - Bit position (0-23)
 * @returns New bitfield value with bit toggled
 */
export function toggleBit(value: number, bit: number): number {
  return (value ^ (1 << bit)) >>> 0;
}

/**
 * Set a single bit in a bitfield.
 * @param value - Current bitfield value
 * @param bit - Bit position (0-23)
 * @param active - Whether the bit should be set (true) or cleared (false)
 * @returns New bitfield value
 */
export function setBit(value: number, bit: number, active: boolean): number {
  if (active) {
    return (value | (1 << bit)) >>> 0;
  } else {
    return (value & ~(1 << bit)) >>> 0;
  }
}

/**
 * Check if a specific bit is set in a bitfield.
 * @param value - Bitfield value
 * @param bit - Bit position (0-23)
 * @returns true if bit is set
 */
export function isBitSet(value: number, bit: number): boolean {
  return ((value >>> bit) & 1) === 1;
}

/**
 * Combine AM and PM bitfields into a single 48-slot array.
 * @param amValue - AM period bitfield (00:00-11:30)
 * @param pmValue - PM period bitfield (12:00-23:30)
 * @returns Array of 48 booleans covering the full day
 */
export function combineAmPm(amValue: number, pmValue: number): boolean[] {
  const amSlots = decodeBitfield(amValue);
  const pmSlots = decodeBitfield(pmValue);
  return [...amSlots, ...pmSlots];
}

/**
 * Split a 48-slot array into AM and PM bitfields.
 * @param slots - Array of 48 booleans
 * @returns Object with am and pm bitfield values
 */
export function splitAmPm(slots: boolean[]): { am: number; pm: number } {
  const amSlots = slots.slice(0, 24);
  const pmSlots = slots.slice(24, 48);
  return {
    am: encodeBitfield(amSlots),
    pm: encodeBitfield(pmSlots),
  };
}
