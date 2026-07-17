import { isCachedEnvelopeValid } from '../src/api/cache';

describe('content cache', () => {
  const now = new Date('2026-07-15T18:00:00.000Z').getTime();

  it('keeps offline content before its next visibility transition', () => {
    expect(
      isCachedEnvelopeValid(
        { data: { id: 'home' }, nextChangeAt: '2026-07-15T18:00:01.000Z' },
        now,
      ),
    ).toBe(true);
  });

  it('expires offline content at its next visibility transition', () => {
    expect(
      isCachedEnvelopeValid(
        { data: { id: 'home' }, nextChangeAt: '2026-07-15T18:00:00.000Z' },
        now,
      ),
    ).toBe(false);
  });
});
