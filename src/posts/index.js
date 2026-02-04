'use strict';

// --- TEAMMATE IMPORTS (UPDATE THESE PATHS) ---
// Change '../path/to/permissions' to the real location of your teammate's file
const { checkViewPermission } = require('../path/to/permissions'); 
const { generateFakeProfile } = require('../path/to/fakeProfile');
// ---------------------------------------------

const _ = require('lodash');

const db = require('../database');
const utils = require('../utils');
const user = require('../user');
const privileges = require('../privileges');
const plugins = require('../plugins');

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

// --- MODIFIED FUNCTION WITH ANONYMOUS FRAMEWORK ---
Posts.getPostsByPids = async function (pids, uid) {
    if (!Array.isArray(pids) || !pids.length) {
        return [];
    }

    // 1. Fetch raw data
    let posts = await Posts.getPostsData(pids);
    
    // 2. Parse markdown and attach User data
    posts = await Promise.all(posts.map(Posts.parsePost));
    
    // 3. Fire standard plugins (hooks)
    const data = await plugins.hooks.fire('filter:post.getPosts', { posts: posts, uid: uid });
    
    if (!data || !Array.isArray(data.posts)) {
        return [];
    }

    // 4. ANONYMOUS FRAMEWORK INTERCEPT
    // We iterate over the posts right before returning them to the browser
    for (const post of data.posts) {
        // Check if post exists and has the 'isAnon' flag from the database
        if (post && post.isAnon) {
            
            // Check if the viewer (uid) is allowed to see the real identity
            // We await the result from your teammate's permission function
            const canSee = await checkViewPermission(uid, post.pid);

            if (!canSee) {
                // If they can't see the real name, generate the fake profile
                const fakeUser = await generateFakeProfile(post.uid);

                // Overwrite the User Object for the frontend
                if (post.user) {
                    post.user.username = fakeUser.username || 'Anonymous Student';
                    post.user.displayname = fakeUser.username || 'Anonymous Student';
                    post.user.userslug = 'anonymous'; // Prevents linking to real profile
                    
                    // Handle avatar/picture
                    post.user.picture = fakeUser.picture || null;
                    post.user.icon_text = '?';
                    post.user.icon_bgColor = '#666';

                    // Scrub identifying details
                    post.user.fullname = '';
                    post.user.signature = '';
                    post.user.reputation = 0;
                    post.user.status = 'offline';
                }
            }
        }
    }
    // -------------------------------------------------

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