import { dueStatus } from './dueDate'

function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

describe('dueStatus', () => {
  it('flags a past date as overdue', () => {
    expect(dueStatus(daysFromNow(-1))).toBe('overdue')
    expect(dueStatus(daysFromNow(-30))).toBe('overdue')
  })

  it('flags today and the next few days as due-soon', () => {
    expect(dueStatus(daysFromNow(0))).toBe('due-soon')
    expect(dueStatus(daysFromNow(3))).toBe('due-soon')
  })

  it('flags dates further out as on-track', () => {
    expect(dueStatus(daysFromNow(4))).toBe('on-track')
    expect(dueStatus(daysFromNow(30))).toBe('on-track')
  })

  it('respects a custom due-soon window', () => {
    expect(dueStatus(daysFromNow(5), 7)).toBe('due-soon')
    expect(dueStatus(daysFromNow(8), 7)).toBe('on-track')
  })
})
