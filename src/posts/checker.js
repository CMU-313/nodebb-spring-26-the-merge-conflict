'use strict';

const meta = require('../meta');

module.exports = function (Posts) {
	Posts.checkContentAgainstDisallowedRules = function (content) {
		const disallowed = parseRules(meta.config.disallowedWebsites);
		if (!disallowed.length) {
			return {
				enabled: true,
				hasDisallowedContent: false,
			};
		}

		const normalizedContent = String(content || '').toLowerCase();
		const matchedDisallowed = disallowed.find(rule => normalizedContent.includes(rule));
		const result = {
			enabled: true,
			hasDisallowedContent: Boolean(matchedDisallowed),
			matchedRule: matchedDisallowed || '',
		};

		return result;
	};
};

function parseRules(rules) {
	if (Array.isArray(rules)) {
		return normalizeRules(rules);
	}

	const rawRules = String(rules || '').trim();
	if (!rawRules) {
		return [];
	}

	if (rawRules.startsWith('[') && rawRules.endsWith(']')) {
		try {
			const parsed = JSON.parse(rawRules);
			if (Array.isArray(parsed)) {
				return normalizeRules(parsed);
			}
		} catch (err) {
			// fall through to delimited parsing
		}
	}

	return normalizeRules(rawRules.split(/[\n,]/));
}

function normalizeRules(rules) {
	return rules
		.map(rule => String(rule || '').trim().replace(/^['"]|['"]$/g, '').toLowerCase())
		.filter(Boolean);
}
