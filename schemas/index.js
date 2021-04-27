const objMergeDeep = require('merge-deep');

module.exports = (schema, object) => {
	if (!object && arguments.length === 2) return object;
	schema = require(`./${schema}.js`);

	return objMergeDeep(schema, object);
};
