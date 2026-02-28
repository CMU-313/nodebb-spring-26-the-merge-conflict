'use strict';

define('forum/account/follow-requests', [
	'forum/account/header', 'components', 'api', 'alerts',
], function (header, components, api, alerts) {
	const FollowRequests = {};

	FollowRequests.init = function () {
		header.init();

		const container = components.get('account/follow-requests/list');
		if (!container.length) {
			return;
		}

		container.on('click', '[component="account/follow-requests/accept"]', async function (e) {
			e.preventDefault();
			const btn = $(this);
			const requesterUid = btn.data('requester-uid');
			try {
				await api.put(`/users/${ajaxify.data.uid}/follow-requests/${requesterUid}/accept`, {});
				alerts.success('[[user:follow-request-accepted]]');
				btn.closest('[data-uid]').remove();
			} catch (err) {
				alerts.error(err);
			}
		});

		container.on('click', '[component="account/follow-requests/reject"]', async function (e) {
			e.preventDefault();
			const btn = $(this);
			const requesterUid = btn.data('requester-uid');
			try {
				await api.del(`/users/${ajaxify.data.uid}/follow-requests/${requesterUid}/reject`, {});
				alerts.success('[[user:follow-request-rejected]]');
				btn.closest('[data-uid]').remove();
			} catch (err) {
				alerts.error(err);
			}
		});
	};

	return FollowRequests;
});
