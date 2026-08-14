# Quality Risk Report

## Risk: Misleading "Offline Content" Banner for Valid Cached Content

- **Severity:** Medium (User Experience / Confusion)
- **Affected Layer:** Mobile Component/Integration (Cache state interpretation)
- **Affected Platform:** Both iOS and Android
- **User Journey:** Offline content recovery

### Preconditions
- Content fetched with `nextChangeAt` set to a future date (e.g., valid for 2 hours).
- Device loses network connection.
- App attempts to load the same content.

### Expected Result
Content displays without offline banner (since content is still within its validity window).

### Actual Result
"Offline content" banner appears despite content being valid.

### Automated Evidence
`__tests__/CacheRisk.test.tsx` demonstrates the defect by:
1. Mocking an API response with future `nextChangeAt`.
2. Simulating network failure.
3. Verifying that `stale: true` is returned (current behavior).
4. Asserting that the UI shows the offline banner when it should not.

### Technical Cause
Conflation of "data source stale" (came from cache) with "content expired" (past display validity). The app marks cached content as `stale: true` regardless of `nextChangeAt`, leading to the incorrect banner.

### Investigation Direction
The `stale` flag should be derived from a comparison of the current time against `nextChangeAt`. Only when `nextChangeAt` is in the past should `stale: true` be set. If `nextChangeAt` is in the future, the cached content should be considered fresh and the banner should not appear.