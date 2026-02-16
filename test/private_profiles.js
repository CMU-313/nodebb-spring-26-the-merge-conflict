'use strict';

const assert = require('assert');
const user = require('../src/user'); // Pulls in the core file you modified

describe('Private Profile Feature', () => {
	let testUid;

	// 1. SETUP: Create a temporary user before the tests run
	before(async () => {
		testUid = await user.create({ username: 'privacyTester' });
	});

	// 2. TEST 1: Check the default state
	it('should default privateProfile to false for a new user', async () => {
		const settings = await user.getSettings(testUid);
        
		// We expect it to be false because of the default '0' you added
		assert.strictEqual(settings.privateProfile, false, 'Default should be false');
	});

	// 3. TEST 2: Turn the setting ON
	it('should successfully save the privateProfile setting as true', async () => {
		// NodeBB requires pagination settings to be present when saving settings,
		// so we must include them in our dummy payload alongside privateProfile.
		await user.saveSettings(testUid, {
			privateProfile: 1, 
			postsPerPage: 20,
			topicsPerPage: 20,
		});

		// Fetch the settings again to see if it actually saved
		const settings = await user.getSettings(testUid);
		assert.strictEqual(settings.privateProfile, true, 'Setting should be saved and returned as true');
	});

	// 4. TEST 3: Turn the setting OFF
	it('should successfully revert the privateProfile setting to false', async () => {
		await user.saveSettings(testUid, {
			privateProfile: 0,
			postsPerPage: 20,
			topicsPerPage: 20,
		});

		const settings = await user.getSettings(testUid);
		assert.strictEqual(settings.privateProfile, false, 'Setting should be reverted to false');
	});
});
