const pi = Math.PI;

export function radians(d)
{
	return d * pi / 180;
}

export function degrees(r)
{
	return r * 180 / pi;
}

export function linearMix(a, b, x)
{
	return a * (1 - x) + b * x;
}

export function smoothMix(a, b, x)
{
	return a + x ** 2 * (3 - 2 * x) * (b - a);
}

export function smoothMix2d(aa, ba, ab, bb, x, y)
{
	return smoothMix(
		smoothMix(aa, ba, x),
		smoothMix(ab, bb, x),
		y,
	);
}

export function smoothMix3d(aaa, baa, aba, bba, aab, bab, abb, bbb, x, y, z)
{
	return smoothMix(
		smoothMix(
			smoothMix(aaa, baa, x),
			smoothMix(aba, bba, x),
			y,
		),
		smoothMix(
			smoothMix(aab, bab, x),
			smoothMix(abb, bbb, x),
			y,
		),
		z,
	);
}
