var exports = module.exports = {};

exports.getDate = function () {
	var date = new Date(Number('ms'));
	var dateToStr = date.toUTCString().split(' ');
	var cleanDate = dateToStr[2] + ' ' + dateToStr[1] ;
	return cleanDate;
}

exports.authenticate = function(req, res, next) {
  var isSession = false;

  if(req.session.username) {
    isSession = true;
    next();
  }
  else {
    res.redirect('login');
  }
}