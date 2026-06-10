/**
 * Standard display template for a unit across the app:
 *
 *     {Level_Name} {Unit_Name}{ - Unit Description | if not empty}
 *
 * Example outputs:
 *   - "یوسی 1 - سید پور، گوکینہ"
 *   - "زون زون 4"        (no description)
 *   - "101A"              (no level or description)
 *   - "101A - Top City 1" (no level, has description)
 *
 * Tolerates both DB / API casings: `{name | Name}`,
 * `{description | Description}`, `{level_name | Level_Name}`.
 *
 * If a `levelsById` map is provided and `level_name` is absent, this will
 * look up the unit's `Level_id` (or `level_id`) in the map.
 */
type UnitLike = {
  Name?: string | null;
  name?: string | null;
  Description?: string | null;
  description?: string | null;
  Level_Name?: string | null;
  level_name?: string | null;
  Level_id?: number | null;
  level_id?: number | null;
};

export const formatUnitDisplay = (
  unit: UnitLike | null | undefined,
  levelsById?: Record<number, { Name?: string | null; name?: string | null } | undefined>
): string => {
  if (!unit) return '';

  const name = (unit.Name ?? unit.name ?? '').toString().trim();
  const description = (unit.Description ?? unit.description ?? '').toString().trim();

  let levelName = (unit.Level_Name ?? unit.level_name ?? '').toString().trim();
  if (!levelName && levelsById) {
    const levelId = unit.Level_id ?? unit.level_id ?? null;
    if (levelId != null) {
      const lvl = levelsById[levelId];
      levelName = ((lvl?.Name ?? lvl?.name ?? '') as string).trim();
    }
  }

  const head = levelName ? `${levelName} ${name}`.trim() : name;
  return description ? `${head} - ${description}` : head;
};

// Default export to prevent Expo Router from treating this as a route
export default {};
