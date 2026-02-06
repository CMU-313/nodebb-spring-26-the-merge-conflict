'use strict';

/**
 * US1: Task 3 - Generate anonymized profile data
 */
async function generateFakeProfile(uid) {
    return {
        username: 'Anonymous Student',
        displayname: 'Anonymous Student',
        picture: null,
        userslug: 'anonymous'
    };
}

module.exports = {
    generateFakeProfile,
};