'use strict';

// 1. Define your word lists
const adjectives = [
	'Anonymous', 'Secret', 'Hidden', 'Mystery', 'Silent', 
	'Unknown', 'Masked', 'Ghostly', 'Quiet', 'Shadow',
];

const animals = [
	'Badger', 'Bear', 'Beaver', 'Cat', 'Dog', 
	'Eagle', 'Fox', 'Hawk', 'Lion', 'Owl', 
	'Panda', 'Shark', 'Tiger', 'Wolf', 'Zebra',
];
const colors = ['#666', '#d9534f', '#5cb85c', '#5bc0de', '#f0ad4e', '#292b2c'];
const stockImages = [
	'badger.png',
	'bear.png',
	'beaver.png',
	'cat.png',
	'dog.png',
	'eagle.png',
	'fox.png',
	'hawk.png',
	'lion.png',
	'owl.png',
	'panda.png',
	'shark.png',
	'tiger.png',
	'wolf.png',
	'zebra.png',
];

// 2. Helper: Deterministic Hash
// This converts a User ID (string/int) into a consistent number.
// Example: getHash("123") always returns the same number.
function getHash(str) {
	let hash = 0;
	str = String(str); // Ensure it's a string
	for (let i = 0; i < str.length; i++) {
		// Simple arithmetic hash: hash * 31 + charCode
		hash = ((hash * 31) + str.charCodeAt(i)) % 1000000007; 
	}
	return Math.abs(hash);
}

// 3. The Main Function
const generateFakeProfile = async function (uid) {
	// If no UID is provided, fallback to pure random
	const seed = uid ? getHash(uid) : Math.floor(Math.random() * 1000);

	// Use the seed to pick an index from the arrays
	const adjIndex = seed % adjectives.length;
	const animIndex = seed % animals.length;
	const imageIndex = seed % stockImages.length;
	const colorIndex = seed % colors.length;
	const fakeUsername = `${adjectives[adjIndex]} ${animals[animIndex]}`;
	const picturePath = `./randomPictures/${stockImages[imageIndex]}`;
	return {
		username: fakeUsername,
		picture: picturePath,
		color: colors[colorIndex],
	};
};

module.exports = {
	generateFakeProfile,
};