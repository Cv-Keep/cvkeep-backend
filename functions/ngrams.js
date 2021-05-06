module.exports = {
	generate(word, limit = 3) {
		if (!word || word.length <= limit) return [word];

		const subWord = word.substr(1, word.length);
		const results = [word, ...this.generate(subWord)];

		for (let i = limit; i < word.length; i++) {
			results.push(...this._chunkStr(word, i));
		}

		return this._arrClean(results, limit);
	},

	_chunkStr(str, chSize) {
		const reg = new RegExp(`.{1,${chSize}}`, 'g');

		return str.match(reg);
	},

	_arrClean(arr, strLimit) {
		const _arr = [...new Set(arr)]
			.join(' ')
			.replace(/[^A-zÀ-ú0-9._\/\\@]+/g, ' ')
			.replace(/\s\s+/g, ' ')
			.split(' ');

		return [...new Set(_arr)]
			.map(item => item.trim())
			.filter(item => (item.length > strLimit - 1));
	},
};
