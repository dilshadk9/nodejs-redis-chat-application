var exports = module.exports = {};

exports.getDate = function () {
	var date = new Date(Number(ms));
	var dateToStr = date.toUTCString().split(' ');
	var cleanDate = dateToStr[2] + ' ' + dateToStr[1] ;
	return cleanDate;
}