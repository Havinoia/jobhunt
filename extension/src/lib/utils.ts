/**
 * JobHunt — Common Utilities
 */

/**
 * Safely extracts a string name from a skill that might be an object
 * (AI sometimes returns confidence scores or metadata)
 */
export function getSkillName(skill: any): string {
  if (!skill) return "";
  if (typeof skill === "string") return skill;
  if (typeof skill === "object") {
    return skill.name || skill.skill || JSON.stringify(skill);
  }
  return String(skill);
}
