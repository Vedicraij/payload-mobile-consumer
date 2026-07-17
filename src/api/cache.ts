export type CachedEnvelope<T> = { data: T; nextChangeAt?: string };

export const isCachedEnvelopeValid = <T>(
  envelope: CachedEnvelope<T>,
  now = Date.now(),
) => !envelope.nextChangeAt || now < new Date(envelope.nextChangeAt).getTime();
