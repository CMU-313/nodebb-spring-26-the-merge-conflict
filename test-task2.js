'use strict';

// 1. MOCKING THE ENVIRONMENT
// We create fake versions of the modules your code relies on
const mockUser = {
    isAdministrator: async (uid) => uid === 1 // Only UID 1 is an Admin
};

const mockPrivileges = {
    categories: {
        isModerator: async (cid, uid) => uid === 2 // Only UID 2 is a Mod
    }
};

const mockPosts = {
    getPostFields: async (pid, fields) => ({ tid: 500 }),
    getTopicField: async (tid, field) => 10, 
    getPostField: async (pid, field) => 99, // Original poster is UID 99
};

// 2. YOUR LOGIC (Simplified for testing)
// This is a copy of the logic you put in permissions.js
async function checkViewPermission(uid, pid) {
    if (!uid) return false;

    // Gate 1: Admin Check
    const isAdmin = await mockUser.isAdministrator(uid);
    if (isAdmin) return true;

    // Gate 2: Mod Check
    const postData = await mockPosts.getPostFields(pid, ['tid']);
    const cid = await mockPosts.getTopicField(postData.tid, 'cid');
    const isMod = await mockPrivileges.categories.isModerator(cid, uid);
    if (isMod) return true;

    // Gate 3: Self Check
    const posterUid = await mockPosts.getPostField(pid, 'uid');
    if (parseInt(uid, 10) === parseInt(posterUid, 10)) return true;

    return false;
}

// 3. THE TEST SUITE
async function runTest() {
    console.log('--- Task 2 Verification ---');

    const testCases = [
        { uid: 1, name: 'Admin', expected: true },
        { uid: 2, name: 'Moderator', expected: true },
        { uid: 99, name: 'The Poster', expected: true },
        { uid: 5, name: 'Random Student', expected: false }
    ];

    for (const test of testCases) {
        const result = await checkViewPermission(test.uid, 101);
        const passed = result === test.expected;
        console.log(`${passed ? '✅' : '❌'} ${test.name}: ${result ? 'Can see identity' : 'Sees Anonymous'}`);
    }
}

runTest();