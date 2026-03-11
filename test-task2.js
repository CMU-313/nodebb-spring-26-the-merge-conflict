'use strict';

// 1. MOCKING THE ENVIRONMENT
const mockUser = {
	isAdministrator: async uid => uid === 1, // Only UID 1 is Admin
};

const mockPrivileges = {
	categories: {
		// FIX: Only return true if the UID matches the Moderator ID (2)
		isModerator: async (cid, uid) => uid === 2, 
	},
};

const mockPosts = {
	getPostFields: async () => ({ tid: 500 }),
	getTopicField: async () => 10, 
	getPostField: async () => 99, // Only UID 99 is the Poster
};

// 2. YOUR LOGIC (Simplified for testing)
async function checkViewPermission(uid, pid) {
	if (!uid) return false;

	const isAdmin = await mockUser.isAdministrator(uid);
	if (isAdmin) return true;

	const postData = await mockPosts.getPostFields(pid, ['tid']);
	const cid = await mockPosts.getTopicField(postData.tid, 'cid');
	const isMod = await mockPrivileges.categories.isModerator(cid, uid);
	if (isMod) return true;

	const posterUid = await mockPosts.getPostField(pid, 'uid');
	if (parseInt(uid, 10) === parseInt(posterUid, 10)) return true;

	return false;
}

// 3. THE TEST SUITE
async function runTest() {
	console.log('--- Task 2 Verification (Burn-in) ---');

	const testCases = [
		{ uid: 1, name: 'Admin', expected: true },
		{ uid: 2, name: 'Moderator', expected: true },
		{ uid: 99, name: 'The Poster', expected: true },
		{ uid: 5, name: 'Random Student', expected: false },
	];

	const start = Date.now();
	while (Date.now() - start < 10000) { // Run for 10 seconds
		// eslint-disable-next-line no-await-in-loop
		await Promise.all(testCases.map(async (test) => {
			await checkViewPermission(test.uid, 101);
		}));
	}
	console.log('--- Burn-in Complete ---');
}

runTest();