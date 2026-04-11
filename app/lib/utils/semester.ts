/**
 * Shared semester utility — single source of truth.
 * Mirrors the `getCurrentSemesterString()` logic in enrollments.service.ts.
 *
 * Academic year starts in September (month index 8):
 *   Sep–Jan → Semester I
 *   Feb–Aug → Semester II
 *
 * Returns a string like: "2025/26 Semester I"
 */
export function getCurrentSemester(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    const startYear = month >= 8 ? year : year - 1;
    const endYear = startYear + 1;
    const semester = month >= 8 || month <= 1 ? 'Semester I' : 'Semester II';
    return `${startYear}/${endYear.toString().slice(-2)} ${semester}`;
}

/**
 * Returns all semester options for the dropdown selector,
 * covering the current and one previous academic year.
 */
export function getSemesterOptions(): string[] {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const startYear = month >= 8 ? year : year - 1;
    const prevStart = startYear - 1;

    return [
        `${startYear}/${(startYear + 1).toString().slice(-2)} Semester I`,
        `${startYear}/${(startYear + 1).toString().slice(-2)} Semester II`,
        `${prevStart}/${startYear.toString().slice(-2)} Semester I`,
        `${prevStart}/${startYear.toString().slice(-2)} Semester II`,
    ];
}
