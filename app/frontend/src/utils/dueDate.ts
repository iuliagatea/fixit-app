export type DueStatus = 'overdue' | 'due-soon' | 'on-track'

const DUE_SOON_DAYS = 3

/** `expected_completion_date` is a plain "YYYY-MM-DD" date (no time/zone), compared against local today. */
export function dueStatus(expectedCompletionDate: string, dueSoonDays = DUE_SOON_DAYS): DueStatus {
  const due = new Date(`${expectedCompletionDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) return 'overdue'
  if (diffDays <= dueSoonDays) return 'due-soon'
  return 'on-track'
}
