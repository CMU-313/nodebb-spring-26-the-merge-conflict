# User Guide

## Private Profile

### Feature Summary
A user can set their profile to private. When private mode is enabled, users who are not followers should have restricted access to profile content. Follow requests to private profiles remain pending until accepted.

### How to Use
1. Log in as a user (User A).
2. Go to account settings and enable `privateProfile`.
3. Save settings.
4. From another account (User B), visit User A's profile.
5. Send a follow request from User B to User A.
6. Log back in as User A and accept User B's follow request.
7. Revisit User A's profile as User B to confirm follower-level visibility.

### Manual User Testing Plan
1. **Default state**
	- Create a fresh user and confirm `privateProfile` defaults to off.
2. **Toggle behavior**
	- Turn private profile on/off and verify the value persists after refresh/log out.
3. **Follow request flow**
	- Confirm private-profile follow creates `pending` status (not immediate follow).
4. **Accept request flow**
	- Confirm accepting request changes relationship to follower.
5. **Role-based access checks**
	- Validate behavior for: owner, follower, non-follower, and admin.
6. **Unfollow regression check**
	- After accepted follow, unfollow and verify access changes back to non-follower behavior.

### Automated Tests
- File: [test/private_profiles.js](test/private_profiles.js)
- What is tested:
  - Default private setting
  - Saving/reverting `privateProfile`
  - Follow-request pending behavior for private profiles
  - Accept request and follower transition
  - Admin/follower/non-follower access-related scenarios
  - Edge cases (public defaults, unfollow, toggle timing)
- Why this is sufficient:
  - Coverage spans core state transitions (public ↔ private, pending ↔ accepted, follow ↔ unfollow)
  - Includes different actor types and common regressions in privacy-control logic

---

## Disallowed Websites

### Feature Summary
Admins can define disallowed website/domain/keyword rules. The composer-side checker parses these rules and matches user-entered post content against them.

### How to Use
1. Go to Admin Settings → General.
2. In `Disallowed Websites`, add entries (examples: `.com`, `bad-site.org`, `spamword`).
3. Save settings.
4. Open composer (new topic or reply).
5. Enter content containing one of the disallowed rules.
6. Submit and verify checker behavior according to your current implementation scope.

### Manual User Testing Plan
1. **Rule formats**
	- Test comma-separated input (`.com, bad.org`).
	- Test newline-separated input.
	- Test mixed casing and spaces (`.COM`, ` Bad.Org `).
2. **Match behavior**
	- Content includes exact disallowed fragment (`google.com` with `.com`).
	- Content with no disallowed fragment.
3. **Scope checks**
	- Topic composer and reply composer.
	- Admin and non-admin posting paths.
	- Queued/non-queued posting path if queue is enabled.

### Automated Tests
- File: [test/composer/disallowed-rules.js](test/composer/disallowed-rules.js)
- Module under test: [vendor/nodebb-plugin-composer-default/static/lib/composer/disallowed-rules.js](vendor/nodebb-plugin-composer-default/static/lib/composer/disallowed-rules.js)
- What is tested:
  - `parseDisallowedRules` for:
	 - comma-separated strings
	 - newline-separated strings
	 - JSON-array string input
	 - case normalization and quote stripping
  - `getMatchedDisallowedRule` for:
	 - positive match (returns matched rule)
	 - negative match (returns empty string)
- Why this is sufficient:
  - These tests cover the core deterministic logic your feature depends on: parsing settings input and matching content.
  - This isolates checker correctness independent of UI behavior and prevents format-related regressions.

### Running the Automated Tests
- Run all private profile tests:
  - `npx mocha test/private_profiles.js`
- Run disallowed rules tests:
  - `npx mocha test/composer/disallowed-rules.js`