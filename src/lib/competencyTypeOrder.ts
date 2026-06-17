// Canonical display order for competency type groups across the app:
//   Leadership → Behavioural → Technical, then any other type alphabetically.
// Single source of truth so the Job Profile editor, the Competency Table, and
// every type dropdown stay consistent.

const TYPE_ORDER = ["leadership", "behavioural", "technical"];

const normalize = (name?: string) =>
  (name || "").trim().toLowerCase().replace("behavioral", "behavioural");

/** Rank of a competency-type name in the canonical order. Unknown/new types
 *  rank last (and then sort alphabetically among themselves). */
export function competencyTypeRank(name?: string): number {
  const i = TYPE_ORDER.indexOf(normalize(name));
  return i === -1 ? TYPE_ORDER.length : i;
}

/** Comparator for competency-type *names*: canonical order first, then A–Z. */
export function compareCompetencyTypeName(a?: string, b?: string): number {
  return (
    competencyTypeRank(a) - competencyTypeRank(b) ||
    (a || "").localeCompare(b || "")
  );
}
