Instructions: In this file, provide a detailed outline of how to use and user test your new feature(s)
You should also provide a link/description of where your added automated tests can be found, along with a description of what is being tested and why you believe the tests are sufficient for covering the changes that you have made


# Yari: US2 Task 4: Block Non Allowed Links

# What this feature does
Prevents users from posting external links that are not allowed.
Uses two admin settings:
- `allowedWebsites`: If set, every external link in a post must match this list.
- `disallowedWebsites`: Any match is blocked immediately (takes priority over allow list).
Internal forum links are still allowed.

# Where we implemented it
Core blocker logic: `src/posts/queue.js` in `posts.canUserPostContentWithLinks`.
This function is used by post create/reply/edit flows, so one change enforced all those paths.

# Dependency on teammate code
This work relies on existing teammate configuration fields already in the project:
- `allowedWebsites`
- `disallowedWebsites`
We built on that existing config and completed enforcement behavior.

# How to use
1. In Admin settings, set:
    - `allowedWebsites` to something like `example.org,.edu`
    - `disallowedWebsites` to something like `.com,bad site.org`
2. As a regular user, try creating or editing posts:
    - With `https://example.org/...` or `https://school.edu/...` this should be allowed.
    - With `https://notallowed.com/...` when allow list is set this should be blocked.
    - With `https://bad site.org/...` when disallow list is set this should be blocked.
3. If a domain appears in both lists, it is blocked (disallow list wins).

# Automated tests
Tests are in: `test/posts.js` under the 'post link domain restrictions' block.
Added coverage includes:
- Allow list pass case (all links allowed).
- Allow list fail case (any non allowed external link).
- Disallow list fail case.
- Disallow precedence over allow list.
- Integration checks for topic creation being blocked/allowed.

# Why these tests are sufficient
They validate both rule logic (allow/disallow matching) and real posting behavior and they cover the most important acceptance paths: allow, block, and precedence because create/reply/edit all call the same guard function, this gives us strong confidence across posting workflows.


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


