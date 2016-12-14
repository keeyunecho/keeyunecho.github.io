function calcDiff(fft1, fft2) {
	sf = 0;
	for (var i = 0, len = fft1.length; i < len; i++) {
		sf += fft2[i] - fft1[i];
	}
	return sf;
}


function calcAverage(values) {
	s = 0;
	for (var i = 0, len = values.length; i < len; i++) {
		s += values[i];
	}
	return s / values.length;
}

function calcVariance(values) {
	mean = calcAverage(values);
	v = [];
	for (var i = 0, len = values.length; i < len; i++) {
		s += Math.pow(values[i] - mean, 2);
	}
	return calcAverage(v);
}
