'use strict';

const user = require('../user');
const privileges = require('../privileges');
const posts = require('./index'); //Olivers function to get post data, topic data, and category data

/**
 * US1: Task 2 - Allow admin/mod to still see original poster
 */
async function checkViewPermission(uid, pid) {
    if (!uid) {
        return false;
    }

    // 1. Check if the user is a Global Administrator
    const isAdmin = await user.isAdministrator(uid);
    if (isAdmin) {
        return true;
    }

    // 2. Check if the user is a Moderator of the category this post belongs to
    // We need the Topic ID (tid) to find the Category ID (cid)
    const postData = await posts.getPostFields(pid, ['tid']);
    if (postData && postData.tid) {
        const cid = await posts.getTopicField(postData.tid, 'cid');
        const isMod = await privileges.categories.isModerator(cid, uid);
        if (isMod) {
            return true;
        }
    }

    // 3. Acceptance Criteria Check: If the viewer IS the poster, they should see themselves
    const posterUid = await posts.getPostField(pid, 'uid');
    if (parseInt(uid, 10) === parseInt(posterUid, 10)) {
        return true;
    }

    // Default: User is a student/standard viewer and should see "Anonymous"
    return false;
}

module.exports = {
    checkViewPermission,
};