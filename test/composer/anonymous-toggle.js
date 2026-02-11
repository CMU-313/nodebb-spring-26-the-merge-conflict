'use strict';

const assert = require('assert');
const { JSDOM } = require('jsdom');
describe('composer anonymous toggle', () => {
	let dom;
	let $;
	let bindAnonymousToggle;

	beforeEach(() => {
		dom = new JSDOM('<html><body></body></html>');
		global.window = dom.window;
		global.document = dom.window.document;
		delete require.cache[require.resolve('jquery')];
		delete require.cache[require.resolve('../../vendor/nodebb-plugin-composer-default/static/lib/composer/anonymous-toggle')];
		global.jQuery = require('jquery');
		global.$ = global.jQuery;
		$ = global.$;
		bindAnonymousToggle = require('../../vendor/nodebb-plugin-composer-default/static/lib/composer/anonymous-toggle');
	});

	afterEach(() => {
		dom.window.close();
		delete global.window;
		delete global.document;
		delete global.jQuery;
		delete global.$;
	});

	it('toggles anonymous mode and updates UI', () => {
		const $container = $(
			'<div>' +
				'<input type="hidden" name="anonymous" value="0" />' +
				'<button component="composer/anonymous-toggle">' +
					'<i class="fa fa-globe"></i>' +
					'<span>Public</span>' +
				'</button>' +
			'</div>'
		).appendTo('body');

		bindAnonymousToggle($container);

		const $btn = $container.find('[component="composer/anonymous-toggle"]');
		const $input = $container.find('input[name="anonymous"]');
		const $icon = $btn.find('i');
		const $text = $btn.find('span');

		assert.strictEqual($input.val(), '0');

		$btn.trigger('click');
		assert.strictEqual($input.val(), '1');
		assert.strictEqual($icon.attr('class'), 'fa fa-user-secret');
		assert.strictEqual($text.text(), 'Anonymous');

		$btn.trigger('click');
		assert.strictEqual($input.val(), '0');
		assert.strictEqual($icon.attr('class'), 'fa fa-globe');
		assert.strictEqual($text.text(), 'Public');
	});
});
