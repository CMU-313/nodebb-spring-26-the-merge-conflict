(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define('composer/anonymous-toggle', ['jquery'], factory);
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory(require('jquery'));
	}
}(function ($) {
	'use strict';

	return function bindAnonymousToggle(postContainer) {
		if (!postContainer || !postContainer.length) {
			return;
		}

		postContainer.on('click', '[component="composer/anonymous-toggle"]', function (e) {
			e.preventDefault();

			const $btn = $(this);
			const input = postContainer.find('input[name="anonymous"]');

			if (!input.length) {
				console.warn('Anonymous input not found!');
				return;
			}

			const newVal = input.val() === '1' ? '0' : '1';
			input.val(newVal);

			const $icon = $btn.find('i');
			const $text = $btn.find('span');

			if (newVal === '1') {
				$icon.attr('class', 'fa fa-user-secret');
				$text.text('Anonymous');
			} else {
				$icon.attr('class', 'fa fa-globe');
				$text.text('Public');
			}

			console.log('Anonymous mode now:', newVal);
		});
	};
}));
