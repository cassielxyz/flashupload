import { describe, expect, it } from 'vitest'
import { CHUNK_GRANULARITY, DEFAULT_CHUNK_SIZE, getAdaptiveChunkSize, isRetryableStatus, normalizeChunkSize, parseRangeEnd } from '@/lib/drive-upload'

describe('Drive resumable upload helpers', () => {
  it('keeps chunks aligned to Google Drive 256 KiB granularity', () => {
    expect(normalizeChunkSize(8_500_000) % CHUNK_GRANULARITY).toBe(0)
    expect(normalizeChunkSize(1)).toBe(CHUNK_GRANULARITY)
  })
  it('adapts chunk size without dropping below the safe default', () => {
    expect(getAdaptiveChunkSize(500_000)).toBe(DEFAULT_CHUNK_SIZE)
    expect(getAdaptiveChunkSize(2_000_000)).toBe(16 * 1024 * 1024)
    expect(getAdaptiveChunkSize(6_000_000)).toBe(32 * 1024 * 1024)
  })
  it('parses Drive resume ranges', () => {
    expect(parseRangeEnd('bytes=0-524287')).toBe(524287)
    expect(parseRangeEnd(null)).toBe(-1)
    expect(parseRangeEnd('invalid')).toBe(-1)
  })
  it('only retries transient HTTP responses', () => {
    expect(isRetryableStatus(408)).toBe(true)
    expect(isRetryableStatus(429)).toBe(true)
    expect(isRetryableStatus(503)).toBe(true)
    expect(isRetryableStatus(400)).toBe(false)
    expect(isRetryableStatus(401)).toBe(false)
  })
})
