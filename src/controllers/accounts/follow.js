'use strict';

const nconf = require('nconf');

const user = require('../../user');
const helpers = require('../helpers');
const pagination = require('../../pagination');

const followController = module.exports;

const url = nconf.get('url');

followController.getFollowing = async function (req, res, next) {
	await getFollow('account/following', 'following', req, res, next);
};

followController.getFollowers = async function (req, res, next) {
	await getFollow('account/followers', 'followers', req, res, next);
};

followController.getFollowRequests = async function (req, res, next) {
	const { userData: payload } = res.locals;
	if (!payload) {
		return next();
	}
	const { username, userslug } = payload;
	const page = parseInt(req.query.page, 10) || 1;
	const resultsPerPage = 50;
	const start = Math.max(0, page - 1) * resultsPerPage;
	const stop = start + resultsPerPage - 1;

	const { users, count } = await user.getIncomingFollowRequests(res.locals.userData.uid, start, stop);
	payload.title = `[[pages:account/follow-requests, ${username}]]`;
	payload.users = users;
	payload.pagination = pagination.create(page, Math.max(1, Math.ceil(count / resultsPerPage)));
	payload.breadcrumbs = helpers.buildBreadcrumbs([{ text: username, url: `/user/${userslug}` }, { text: '[[user:incoming-follow-requests]]' }]);
	res.locals.linkTags = [{ rel: 'canonical', href: `${url}${req.url.replace(/^\/api/, '')}` }];
	res.render('account/follow-requests', payload);
};

async function getFollow(tpl, name, req, res, next) {
	const { userData: payload } = res.locals;
	if (!payload) {
		return next();
	}
	const {
		username, userslug, followerCount, followingCount,
	} = payload;

	const page = parseInt(req.query.page, 10) || 1;
	const resultsPerPage = 50;
	const start = Math.max(0, page - 1) * resultsPerPage;
	const stop = start + resultsPerPage - 1;

	payload.title = `[[pages:${tpl}, ${username}]]`;

	const method = name === 'following' ? 'getFollowing' : 'getFollowers';
	payload.users = await user[method](res.locals.userData.uid, start, stop);

	const count = name === 'following' ? followingCount : followerCount;
	const pageCount = Math.ceil(count / resultsPerPage);
	payload.pagination = pagination.create(page, pageCount);

	payload.breadcrumbs = helpers.buildBreadcrumbs([{ text: username, url: `/user/${userslug}` }, { text: `[[user:${name}]]` }]);

	res.locals.linkTags = [
		{
			rel: 'canonical',
			href: `${url}${req.url.replace(/^\/api/, '')}`,
		},
	];

	res.render(tpl, payload);
}
