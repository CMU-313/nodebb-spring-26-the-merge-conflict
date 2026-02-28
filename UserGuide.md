Instructions: In this file, provide a detailed outline of how to use and user test your new feature(s)
You should also provide a link/description of where your added automated tests can be found, along with a description of what is being tested and why you believe the tests are sufficient for covering the changes that you have made


# Yari: US2 Task 4: Block Non Allowed Links

# What this feature does
Prevents users from posting external links that match disallowed rules.
Uses one admin setting:
- `disallowedWebsites`: Any matching domain/keyword in post content is blocked.
Internal forum links are still allowed.

# Where we implemented it
Core blocker logic: `src/posts/queue.js` in `posts.canUserPostContentWithLinks`.
This function is used by post create/reply/edit flows, so one change enforced all those paths.

# Dependency on teammate code
This work relies on teammate disallowed rule plumbing already added in composer/API and extends server-side enforcement behavior.

# How to use
1. In Admin settings, set:
    - `disallowedWebsites` to something like `.com,bad-site.org`
2. As a regular user, try creating or editing posts:
    - With `https://example.org/...` this should be allowed if it does not match disallowed rules.
    - With `https://bad-site.org/...` when disallow list is set this should be blocked.

# Automated tests
Tests are in: `test/posts.js` under the 'post link domain restrictions' block.
Added coverage includes:
- Pass case when disallowed list is empty.
- Disallow list fail case.
- Integration checks for topic creation being blocked/allowed with disallowed-only rules.

# Why these tests are sufficient
They validate disallowed-rule matching and real posting behavior. Since create/reply/edit all call the same guard function, this gives strong confidence across posting workflows.


# Amani + Yari: US4 Private Profile Controls

# Amani: US4 Task 2 Admin/mod can still view private profile information
# What was implemented
Private profile setting can be enabled by a user.
Administrators (and intended moderator level privileged viewers) still retain access to private profile information.
Follow behavior for private profiles requires approval instead of immediate follow.

# How to use
1. Set a user profile to private.
2. View that profile as admin/mod and confirm profile information is still visible.
3. Try following the private profile from a regular account and confirm a follow request is created.

# Automated tests
Main test file: `test/private_profiles.js`
Relevant coverage: admin visibility checks, private setting persistence, and private follow request flow.


# Yari: US4 Task 3 Hide information from non authorized viewers
# What was implemented
Non followers are restricted from private profile data access.
Followers (after request acceptance) can view private profile information.
Admin users continue to see private profile data as expected.

# How to use
1. Set profile to private.
2. From a non follower account, verify private data is hidden/restricted.
3. Approve a follow request, then verify the new follower can view private profile data.
4. Verify admin account can view private profile regardless of follow state.

# Automated tests
Main test file: `test/private_profiles.js`
Relevant coverage: non follower restriction checks, follower access after acceptance, and admin bypass behavior.

# Why these US4 tests are sufficient
They cover the main acceptance cases such as private toggle, follow request control, non follower restrictions, follower access, and admin visibility and they also validate both role based access and relationship based access (follower vs non follower).



# Oliver: US4 Task 1 - Setting to make profile private
# What was implemented
Users can now toggle a "Make Profile Private" setting in their account settings.
The private profile setting is:
- Displayed as a checkbox in the Privacy section of account settings
- Saved to the database and persisted across sessions
- Available in the user settings schema via OpenAPI
- Defaults to false (public profile) for new users

# Where we implemented it
- Frontend UI: `vendor/nodebb-theme-harmony-2.1.35/templates/account/settings.tpl` - added checkbox toggle for private profile
- Settings schema: `public/openapi/components/schemas/SettingsObj.yaml` - registered privateProfile boolean field
- Backend logic: `src/user/settings.js` - added privateProfile setting loading/saving with default value handling
- Tests: `test/private_profiles.js` - comprehensive test suite for the feature

# How to use
1. Log in as a regular user and navigate to Account Settings
2. Scroll to the Privacy section
3. Check the "Make Profile Private" checkbox
4. Click "Save Changes" to apply the setting
5. Uncheck the box and save again to make the profile public

# Automated tests
Tests are in: `test/private_profiles.js`
Added coverage includes:
- Default state verification: confirms new users have privateProfile set to false
- Setting persistence: verifies the setting can be saved as true and retrieved correctly
- Setting revocation: confirms the setting can be toggled back to false

# Why these tests are sufficient
They validate the core functionality of the setting - that it defaults correctly, can be enabled/disabled, and persists across retrievals. Since the setting integrates with the existing user settings infrastructure (saveSettings/getSettings), testing these core operations provides confidence that the feature works end-to-end. The pagination settings are included in tests to match real-world usage where settings are saved together.
