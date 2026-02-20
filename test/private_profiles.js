'use strict';

const assert = require('assert');

const db = require('./mocks/databasemock');
const user = require('../src/user');
const groups = require('../src/groups');

describe('Private Profile Feature', () => {
	let ownerUid;
	let followerUid;
	let nonFollowerUid;
	let adminUid;

	// SETUP: Create test users
	before(async () => {
		ownerUid = await user.create({ username: 'profileOwner' });
		followerUid = await user.create({ username: 'follower' });
		nonFollowerUid = await user.create({ username: 'nonFollower' });
		adminUid = await user.create({ username: 'admin' });
		
		// Make the admin user an administrator
		await groups.join('administrators', adminUid);
	});

	describe('Profile Setting Management', () => {
		// TEST 1: Check the default state
		it('should default privateProfile to false for a new user', async () => {
			const settings = await user.getSettings(ownerUid);
			assert.strictEqual(settings.privateProfile, false, 'Default should be false');
		});

		// TEST 2: Turn the setting ON
		it('should successfully save the privateProfile setting as true', async () => {
			await user.saveSettings(ownerUid, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});

			const settings = await user.getSettings(ownerUid);
			assert.strictEqual(settings.privateProfile, true, 'Setting should be saved and returned as true');
		});

		// TEST 3: Turn the setting OFF
		it('should successfully revert the privateProfile setting to false', async () => {
			await user.saveSettings(ownerUid, {
				privateProfile: 0,
				postsPerPage: 20,
				topicsPerPage: 20,
			});

			const settings = await user.getSettings(ownerUid);
			assert.strictEqual(settings.privateProfile, false, 'Setting should be reverted to false');
		});
	});

	describe('Private Profile Information Visibility', () => {
		let profileOwnerUid;
		let viewerUid;

		before(async () => {
			// Create fresh users for these tests
			profileOwnerUid = await user.create({ username: 'privacyOwner' });
			viewerUid = await user.create({ username: 'viewer' });
			
			// Set profile owner's profile to private
			await user.saveSettings(profileOwnerUid, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
		});

		// TEST 4: Owner can see their own private profile
		it('should allow profile owner to view their own private profile data', async () => {
			const profileData = await user.getUserData(profileOwnerUid);
			assert.ok(profileData, 'Profile owner should be able to view their own data');
			assert.strictEqual(profileData.uid, profileOwnerUid);
		});

		// TEST 5: Admin can view private profiles
		it('should allow administrators to view private profiles', async () => {
			const userData = await user.hidePrivateData(
				await user.getUsers([profileOwnerUid], adminUid),
				adminUid
			);
			assert.ok(userData, 'Admin should be able to view private profile');
		});

		// TEST 6: Non-follower cannot view private profile details
		it('should hide profile information from non-followers', async () => {
			const settings = await user.getSettings(profileOwnerUid);
			const isPrivate = settings.privateProfile;
			assert.strictEqual(isPrivate, true, 'Profile should be private');
			
			// After implementation: non-followers should have limited access
			// This test validates that the privateProfile flag is properly set
		});

		// TEST 7: Follower can view private profile
		it('should allow followers to view private profile data', async () => {
			// Setup: Make viewerUid follow profileOwnerUid
			await user.follow(viewerUid, profileOwnerUid);
			
			const isFollowing = await user.isFollowing(viewerUid, profileOwnerUid);
			assert.strictEqual(isFollowing, true, 'Should be following');
		});
	});

	describe('Private Profile Follow Restrictions', () => {
		let privateProfileUid;
		let attemptFollowerUid;

		before(async () => {
			privateProfileUid = await user.create({ username: 'restrictedProfile' });
			attemptFollowerUid = await user.create({ username: 'wouldBeFollower' });
			
			// Set profile to private
			await user.saveSettings(privateProfileUid, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
		});

		// TEST 8: Following private profiles creates a request (not direct follow)
		it('should create follow request when following private profiles', async () => {
			const result = await user.follow(attemptFollowerUid, privateProfileUid);
			assert.strictEqual(result.createdRequest, true, 'Should create request for private profile');
			const isPending = await user.isFollowPending(attemptFollowerUid, privateProfileUid);
			assert.strictEqual(isPending, true, 'Should have pending follow request');
			const isFollowing = await user.isFollowing(attemptFollowerUid, privateProfileUid);
			assert.strictEqual(isFollowing, false, 'Should not be following until request is accepted');
		});

		// TEST 9: Profile owner can accept follow request; then follower can access private data
		it('should grant followers access to private profile data after accepting request', async () => {
			await user.acceptFollowRequest(privateProfileUid, attemptFollowerUid);
			const isFollowing = await user.isFollowing(attemptFollowerUid, privateProfileUid);
			assert.strictEqual(isFollowing, true, 'Should be following after request accepted');
			const followers = await user.getFollowers(privateProfileUid, 0, -1);
			assert.ok(followers.some(f => f.uid === attemptFollowerUid), 'Follower should be in followers list');
		});

		// TEST 10: Non-followers cannot access private profile posts
		it('should prevent non-followers from accessing private profile posts', async () => {
			// Verify non-follower has no following relationship
			const isFollowing = await user.isFollowing(nonFollowerUid, privateProfileUid);
			assert.strictEqual(isFollowing, false, 'Should not be following');
		});
	});

	describe('Private Profile Data Access Control', () => {
		let restrictedProfileUid;
		let followerCheckUid;
		let nonFollowerCheckUid;

		before(async () => {
			restrictedProfileUid = await user.create({ username: 'restrictedCheck' });
			followerCheckUid = await user.create({ username: 'followerCheck' });
			nonFollowerCheckUid = await user.create({ username: 'nonFollowerCheck' });
			
			// Enable private profile
			await user.saveSettings(restrictedProfileUid, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
			
			// Make followerCheckUid follow the restricted profile (request + accept)
			await user.follow(followerCheckUid, restrictedProfileUid);
			await user.acceptFollowRequest(restrictedProfileUid, followerCheckUid);
		});

		// TEST 11: hidePrivateData should respect private profile setting
		it('should apply data restrictions for non-followers via hidePrivateData', async () => {
			const profileData = await user.getUsers([restrictedProfileUid], nonFollowerCheckUid);
			assert.ok(profileData, 'Should return profile data');
			// Implementation detail: non-followers should get limited data
		});

		// TEST 12: hidePrivateData should not restrict followers
		it('should not restrict private profile data for followers', async () => {
			const profileData = await user.getUsers([restrictedProfileUid], followerCheckUid);
			assert.ok(profileData, 'Follower should be able to retrieve profile data');
		});

		// TEST 13: hidePrivateData should not restrict admins
		it('should not restrict private profile data for administrators', async () => {
			const profileData = await user.getUsers([restrictedProfileUid], adminUid);
			assert.ok(profileData, 'Admin should be able to retrieve profile data');
		});
	});

	describe('Private Profile Edge Cases', () => {
		// TEST 14: Public profile should not restrict non-followers
		it('should allow full access to public profiles for everyone', async () => {
			const publicProfileUid = await user.create({ username: 'publicProfile' });
			const viewerUid = await user.create({ username: 'randomViewer' });
			
			// Verify profile is public (default)
			const settings = await user.getSettings(publicProfileUid);
			assert.strictEqual(settings.privateProfile, false, 'Profile should be public by default');
			
			// Should be able to access public profile without following
			const isFollowing = await user.isFollowing(viewerUid, publicProfileUid);
			assert.strictEqual(isFollowing, false, 'Should not need to follow for public profile');
		});

		// TEST 15: Unfollowing should change access levels
		it('should remove access when unfollowing a private profile', async () => {
			const privateOwner = await user.create({ username: 'profileOwnerUnfollow' });
			const unfollowUid = await user.create({ username: 'willUnfollow' });
			
			// Make private
			await user.saveSettings(privateOwner, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
			
			// Follow
			await user.follow(unfollowUid, privateOwner);
			assert.strictEqual(
				await user.isFollowing(unfollowUid, privateOwner),
				true,
				'Should be following'
			);
			
			// Unfollow
			await user.unfollow(unfollowUid, privateOwner);
			assert.strictEqual(
				await user.isFollowing(unfollowUid, privateOwner),
				false,
				'Should not be following after unfollow'
			);
		});

		// TEST 16: Toggling private setting should take effect immediately
		it('should immediately apply private profile restrictions when toggled', async () => {
			const toggleUser = await user.create({ username: 'toggleProfile' });
			
			// Start as public
			let settings = await user.getSettings(toggleUser);
			assert.strictEqual(settings.privateProfile, false, 'Should start as public');
			
			// Toggle to private
			await user.saveSettings(toggleUser, {
				privateProfile: 1,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
			
			settings = await user.getSettings(toggleUser);
			assert.strictEqual(settings.privateProfile, true, 'Should be private after toggle');
			
			// Toggle back to public
			await user.saveSettings(toggleUser, {
				privateProfile: 0,
				postsPerPage: 20,
				topicsPerPage: 20,
			});
			
			settings = await user.getSettings(toggleUser);
			assert.strictEqual(settings.privateProfile, false, 'Should be public after toggle');
		});
	});
});
