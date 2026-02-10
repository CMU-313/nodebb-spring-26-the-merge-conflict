'use strict';

const _ = require('lodash');

const db = require('../database');
const utils = require('../utils');
const user = require('../user');
const privileges = require('../privileges');
const plugins = require('../plugins');
const { generateFakeProfile } = require('./fakeProfile');
const { checkViewPermission } = require('./permissions');

const Posts = module.exports;

require('./data')(Posts);
require('./create')(Posts);
require('./delete')(Posts);
require('./edit')(Posts);
require('./parse')(Posts);
require('./user')(Posts);
require('./topics')(Posts);
require('./category')(Posts);
require('./summary')(Posts);
require('./recent')(Posts);
require('./tools')(Posts);
require('./votes')(Posts);
require('./bookmarks')(Posts);
require('./queue')(Posts);
require('./diffs')(Posts);
require('./uploads')(Posts);

Posts.attachments = require('./attachments');

Posts.exists = async function (pids) {
	return await db.exists(
		Array.isArray(pids) ? pids.map(pid => `post:${pid}`) : `post:${pids}`
	);
};

Posts.getPidsFromSet = async function (set, start, stop, reverse) {
	if (isNaN(start) || isNaN(stop)) {
		return [];
	}
	return await db[reverse ? 'getSortedSetRevRange' : 'getSortedSetRange'](set, start, stop);
};

Posts.getPostsByPids = async function (pids, uid) {
	console.log('the function is called');
	if (!Array.isArray(pids) || !pids.length) {
		return [];
	}

	let posts = await Posts.getPostsData(pids);
	
	posts = await Promise.all(posts.map(Posts.parsePost));
	
	const data = await plugins.hooks.fire('filter:post.getPosts', { posts: posts, uid: uid });
	
	if (!data || !Array.isArray(data.posts)) {
		return [];
	}
	
	// ANONYMOUS LOGIC START
	// 1. Check all permissions in parallel (fixes "await in loop" error)
	const permissions = await Promise.all(data.posts.map(async (post) => {
		if (post && post.anonymous) {
			console.log('there are anonymous posts');
			return await checkViewPermission(uid, post.pid);
		}
		return true; // Non-anon posts are visible
	}));

	// 2. Create fake profiles for masked posts in parallel
	const fakeProfiles = await Promise.all(data.posts.map((post, index) => {
		if (post && post.anonymous && !permissions[index]) {
			return generateFakeProfile(post.uid);
		}
		return null;
	}));

	// 3. Apply the mask synchronously using precomputed fake profiles
	data.posts.forEach((post, index) => {
		const canSee = permissions[index];
		post.authorized = canSee;
		const fakeUser = fakeProfiles[index];

		if (post && post.anonymous && !canSee) {
			if (post.user) {
				post.user.uid = 0; // prevent linking to the real user
				post.user.username = (fakeUser && fakeUser.username) || 'Anonymous';
				post.user.displayname = (fakeUser && fakeUser.username) || 'Anonymous';
				post.user.userslug = '';

				post.user.picture = (fakeUser && fakeUser.picture) || '';
				post.user['icon:text'] = '?';
				post.user['icon:bgColor'] = (fakeUser && fakeUser.color) || '#888';

				post.user.fullname = '';
				post.user.signature = '';
				post.user.reputation = 0;
				post.user.status = 'offline';
			}
		}
	});
	// ANONYMOUS LOGIC END

	return data.posts.filter(Boolean);
};

Posts.getPostSummariesFromSet = async function (set, uid, start, stop) {
	let pids = await db.getSortedSetRevRange(set, start, stop);
	pids = await privileges.posts.filter('topics:read', pids, uid);
	const posts = await Posts.getPostSummaryByPids(pids, uid, { stripTags: false });
	return { posts: posts, nextStart: stop + 1 };
};

Posts.getPidIndex = async function (pid, tid, topicPostSort) {
	const set = topicPostSort === 'most_votes' ? `tid:${tid}:posts:votes` : `tid:${tid}:posts`;
	const reverse = topicPostSort === 'newest_to_oldest' || topicPostSort === 'most_votes';
	const index = await db[reverse ? 'sortedSetRevRank' : 'sortedSetRank'](set, pid);
	if (!utils.isNumber(index)) {
		return 0;
	}
	return utils.isNumber(index) ? parseInt(index, 10) + 1 : 0;
};

Posts.getPostIndices = async function (posts, uid) {
	if (!Array.isArray(posts) || !posts.length) {
		return [];
	}
	const settings = await user.getSettings(uid);

	const byVotes = settings.topicPostSort === 'most_votes';
	let sets = posts.map(p => (byVotes ? `tid:${p.tid}:posts:votes` : `tid:${p.tid}:posts`));
	const reverse = settings.topicPostSort === 'newest_to_oldest' || settings.topicPostSort === 'most_votes';

	const uniqueSets = _.uniq(sets);
	let method = reverse ? 'sortedSetsRevRanks' : 'sortedSetsRanks';
	if (uniqueSets.length === 1) {
		method = reverse ? 'sortedSetRevRanks' : 'sortedSetRanks';
		sets = uniqueSets[0];
	}

	const pids = posts.map(post => post.pid);
	const indices = await db[method](sets, pids);
	return indices.map(index => (utils.isNumber(index) ? parseInt(index, 10) + 1 : 0));
};

Posts.modifyPostByPrivilege = function (post, privileges) {
	if (post && post.deleted && !(post.selfPost || privileges['posts:view_deleted'])) {
		post.content = '[[topic:post-is-deleted]]';
		if (post.user) {
			post.user.signature = '';
		}
	}
};

require('../promisify')(Posts);