export const SCORE_RANGES = [
  { label: 'Excellent', min: 90, max: 100, color: '#10b981' }, // Emerald
  { label: 'Very Good', min: 75, max: 89, color: '#3b82f6' },  // Blue
  { label: 'Satisfactory', min: 50, max: 74, color: '#f59e0b' }, // Amber
  { label: 'Needs Improvement', min: 30, max: 49, color: '#f97316' }, // Orange
  { label: 'Fail', min: 0, max: 29, color: '#ef4444' }, // Red
];

export const GRADE_RANGES = [
  { label: 'All Grades', value: 'all' },
  { label: 'Primary (1-4)', value: '1-4' },
  { label: 'Middle (5-8)', value: '5-8' },
  { label: 'High School (9-12)', value: '9-12' },
];

export const GENDER_OPTIONS = [
  { label: 'All Genders', value: 'all' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];
