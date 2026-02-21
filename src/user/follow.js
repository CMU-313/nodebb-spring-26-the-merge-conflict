
'use strict';

const notifications = require('../notifications');
const plugins = require('../plugins');
const activitypub = require('../activitypub');
const db = require('../database');
const utils = require('../utils');

module.exports = function (User) {
	User.follow = async function (uid, followuid) {
		return await toggleFollow('follow', uid, followuid);
	};

	User.unfollow = async function (uid, unfollowuid) {
		await toggleFollow('unfollow', uid, unfollowuid);
	};

	async function toggleFollow(type, uid, theiruid) {
		if (parseInt(uid, 10) <= 0 || parseInt(theiruid, 10) <= 0) {
			throw new Error('[[error:invalid-uid]]');
		}

		if (parseInt(uid, 10) === parseInt(theiruid, 10)) {
			throw new Error('[[error:you-cant-follow-yourself]]');
		}
		const [exists, isFollowing, isPending] = await Promise.all([
			User.exists(theiruid),
			User.isFollowing(uid, theiruid),
			User.isFollowPending(uid, theiruid),
		]);
		if (!exists) {
			throw new Error('[[error:no-user]]');
		}

		await plugins.hooks.fire('filter:user.toggleFollow', {
			type,
			uid,
			theiruid,
			isFollowing,
			isPending,
		});

		if (type === 'follow') {
			if (isFollowing) {
				throw new Error('[[error:already-following]]');
			}
			if (isPending) {
				throw new Error('[[error:follow-request-already-sent]]');
			}
			// Local users only: check if target has private profile -> create request instead of direct follow
			const isLocal = utils.isNumber(theiruid);
			let createdRequest = false;
			if (isLocal) {
				const settings = await User.getSettings(theiruid);
				if (settings.privateProfile) {
					const now = Date.now();
					await db.sortedSetAdd(`followRequests:uid.${theiruid}`, now, uid);
					createdRequest = true;
				}
			}
			if (!createdRequest) {
				const now = Date.now();
				await db.sortedSetAddBulk([
					[`following:${uid}`, now, theiruid],
					[`followers:${theiruid}`, now, uid],
				]);
			}
			return { createdRequest };
		} 
		if (isPending) {
			await db.sortedSetRemove(`followRequests:uid.${theiruid}`, uid);
		} else if (!isFollowing) {
			throw new Error('[[error:not-following]]');
		} else {
			await db.sortedSetRemoveBulk([
				[`following:${uid}`, theiruid],
				[`followers:${theiruid}`, uid],
			]);
		}
		

		const [followingCount, followingRemoteCount, followerCount, followerRemoteCount] = await db.sortedSetsCard([
			`following:${uid}`, `followingRemote:${uid}`, `followers:${theiruid}`, `followersRemote:${theiruid}`,
		]);
		await Promise.all([
			User.setUserField(uid, 'followingCount', followingCount + followingRemoteCount),
			User.setUserField(theiruid, 'followerCount', followerCount + followerRemoteCount),
		]);
	}

	User.getFollowing = async function (uid, start, stop) {
		return await getFollow(uid, 'following', start, stop);
	};

	User.getFollowers = async function (uid, start, stop) {
		return await getFollow(uid, 'followers', start, stop);
	};

	async function getFollow(uid, type, start, stop) {
		if (parseInt(uid, 10) <= 0) {
			return [];
		}
		let uids = await db.getSortedSetRevRange([
			`${type}:${uid}`,
			`${type}Remote:${uid}`,
		], start, stop);

		// Filter out remote categories
		const isCategory = await db.exists(uids.map(uid => `categoryRemote:${uid}`));
		uids = uids.filter((uid, idx) => !isCategory[idx]);

		const data = await plugins.hooks.fire(`filter:user.${type}`, {
			uids: uids,
			uid: uid,
			start: start,
			stop: stop,
		});
		return await User.getUsers(data.uids, uid);
	}

	User.isFollowing = async function (uid, theirid) {
		const isRemote = activitypub.helpers.isUri(theirid);
		if (parseInt(uid, 10) <= 0 || (!isRemote && (theirid, 10) <= 0)) {
			return false;
		}
		const setPrefix = isRemote ? 'followingRemote' : 'following';
		return await db.isSortedSetMember(`${setPrefix}:${uid}`, theirid);
	};

	// Returns true if uid (caller) has a pending follow request to target (profile owner)
	User.isFollowPending = async function (uid, target) {
		if (parseInt(uid, 10) <= 0) {
			return false;
		}
		// Local user (numeric target): check followRequests:uid.target contains uid
		if (utils.isNumber(target)) {
			return await db.isSortedSetMember(`followRequests:uid.${target}`, String(uid));
		}
		// ActivityPub remote: followRequests:uid.{localId} keyed by target's local id
		return await db.isSortedSetMember(`followRequests:uid.${target}`, uid);
	};

	User.onFollow = async function (uid, targetUid) {
		const userData = await User.getUserFields(uid, ['username', 'userslug']);
		const { displayname } = userData;

		const notifObj = await notifications.create({
			type: 'follow',
			bodyShort: `[[notifications:user-started-following-you, ${displayname}]]`,
			nid: `follow:${targetUid}:uid:${uid}`,
			from: uid,
			path: `/user/${userData.userslug}`,
			mergeId: 'notifications:user-started-following-you',
		});
		if (!notifObj) {
			return;
		}
		notifObj.user = userData;
		await notifications.push(notifObj, [targetUid]);
	};

	User.onFollowRequest = async function (requesterUid, targetUid) {
		const userData = await User.getUserFields(requesterUid, ['username', 'userslug']);
		const { displayname } = userData;

		const notifObj = await notifications.create({
			type: 'follow-request',
			bodyShort: `[[notifications:user-requested-to-follow-you, ${displayname}]]`,
			nid: `follow-request:${targetUid}:uid:${requesterUid}`,
			from: requesterUid,
			path: `/user/${userData.userslug}`,
			mergeId: 'notifications:user-requested-to-follow-you',
		});
		if (!notifObj) {
			return;
		}
		notifObj.user = userData;
		await notifications.push(notifObj, [targetUid]);
	};

	User.getIncomingFollowRequests = async function (uid, start, stop) {
		if (parseInt(uid, 10) <= 0) {
			return { users: [], count: 0 };
		}
		const uids = await db.getSortedSetRevRange(`followRequests:uid.${uid}`, start, stop);
		const count = await db.sortedSetCard(`followRequests:uid.${uid}`);
		const users = await User.getUsers(uids, uid);
		return { users, count };
	};

	User.getIncomingFollowRequestCount = async function (uid) {
		if (parseInt(uid, 10) <= 0) {
			return 0;
		}
		return await db.sortedSetCard(`followRequests:uid.${uid}`);
	};

	User.acceptFollowRequest = async function (uid, requesterUid) {
		const isPending = await db.isSortedSetMember(`followRequests:uid.${uid}`, String(requesterUid));
		if (!isPending) {
			throw new Error('[[error:no-pending-follow-request]]');
		}
		const timestamp = await db.sortedSetScore(`followRequests:uid.${uid}`, requesterUid);
		await Promise.all([
			db.sortedSetRemove(`followRequests:uid.${uid}`, requesterUid),
			db.sortedSetAddBulk([
				[`following:${requesterUid}`, timestamp, uid],
				[`followers:${uid}`, timestamp, requesterUid],
			]),
		]);
		const [followingCount, followerCount] = await db.sortedSetsCard([
			`following:${requesterUid}`, `followers:${uid}`,
		]);
		await Promise.all([
			User.setUserField(requesterUid, 'followingCount', followingCount),
			User.setUserField(uid, 'followerCount', followerCount),
		]);
		await User.onFollow(requesterUid, uid);
	};

	User.rejectFollowRequest = async function (uid, requesterUid) {
		await db.sortedSetRemove(`followRequests:uid.${uid}`, String(requesterUid));
	};
};
