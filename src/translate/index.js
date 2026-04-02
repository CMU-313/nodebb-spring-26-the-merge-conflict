
'use strict';

const TRANSLATOR_URL = 'http://host.docker.internal:5000';
// const TRANSLATOR_API = process.env.TRANSLATOR_API || 'http://localhost:5000';

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	try {
		const url = `${TRANSLATOR_URL}/?content=${encodeURIComponent(postData.content)}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Translator responded with ${response.status}`);
		}
		const data = await response.json();
		return [data.is_english, data.translated_content || ''];
	} catch (err) {
		console.warn(`[translate] Failed to reach translator service: ${err.message}`);
		return [true, ''];
	}
};
