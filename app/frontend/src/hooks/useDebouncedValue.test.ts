import { act, renderHook } from '@testing-library/react'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300))
    expect(result.current).toBe('a')
  })

  it('only updates after the delay has elapsed', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('a')

    act(() => jest.advanceTimersByTime(299))
    expect(result.current).toBe('a')

    act(() => jest.advanceTimersByTime(1))
    expect(result.current).toBe('b')
  })

  it('resets the timer on rapid successive changes', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    act(() => jest.advanceTimersByTime(200))
    rerender({ value: 'c' })
    act(() => jest.advanceTimersByTime(200))

    expect(result.current).toBe('a')

    act(() => jest.advanceTimersByTime(100))
    expect(result.current).toBe('c')
  })
})
