var json2object = function(data) {
	if (typeof data === 'string' || data instanceof String) {
		data = JSON.parse(data);  // string to object
	}
	return data;
}

module.exports = {
	json2object: json2object,
};
