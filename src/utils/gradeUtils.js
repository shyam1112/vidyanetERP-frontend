export function assignGrade(percentage, ranges) {
  if (!ranges || ranges.length === 0) return '';
  const sorted = [...ranges].sort((a, b) => b.minPercent - a.minPercent);
  for (const r of sorted) {
    if (percentage >= r.minPercent) return r.grade;
  }
  return sorted[sorted.length - 1]?.grade || '';
}

// Returns a Badge variant based on where this grade sits in the school's sorted grade list.
// Top 25% → success (green), next 25% → info (blue), next 25% → warning (yellow), bottom → danger (red).
export function gradeVariant(grade, gradeRanges) {
  if (!gradeRanges || gradeRanges.length === 0) {
    // default fallback for built-in grade names
    if (['A+', 'A'].includes(grade)) return 'success';
    if (['B+', 'B'].includes(grade)) return 'info';
    if (grade === 'C') return 'warning';
    return 'danger';
  }
  const sorted = [...gradeRanges].sort((a, b) => b.minPercent - a.minPercent);
  const idx = sorted.findIndex((g) => g.grade === grade);
  if (idx === -1) return 'default';
  const ratio = idx / sorted.length;
  if (ratio < 0.25) return 'success';
  if (ratio < 0.5) return 'info';
  if (ratio < 0.75) return 'warning';
  return 'danger';
}
