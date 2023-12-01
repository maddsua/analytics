
type MetaFbqFunction = (trackType: string, eventID: string, props?: object) => void;

declare let window: {
	dataLayer?: Array<object>;
	gtag?: (command: 'js' | 'config' | 'event', eventName: any, eventParams?: object) => void;
	fbq?: MetaFbqFunction;
	_fbq: MetaFbqFunction;
} & Window;

export const pushEvent = (eventID: string, props?: object) => {

	//	send eventID first character to upper case
	if (eventID[0].toUpperCase() !== eventID[0]) {
		eventID = eventID[0].toUpperCase() + eventID.slice(1);
	}

	let pushedSources = 0;

	if (window.dataLayer) {
		window.dataLayer.push(Object.assign({ 'event': eventID }, props || {}));
		console.log(`Pushed event "${eventID}" to Google Analytics`);
		pushedSources++;
	}

	if (window.fbq) {
		const trackType = [
			'Contact','CustomizeProduct','Donate',
			'FindLocation','InitiateCheckout','Lead',
			'Purchase','Schedule', 'Search',
			'StartTrial','SubmitApplication',
			'Subscribe','ViewContent'
		].some(item => item === eventID) ? 'track' : 'trackCustom';
		window.fbq(trackType, eventID, props);
		console.log(`Pushed event "${eventID}" to Meta Pixel`);
		pushedSources++;
	}

	if (pushedSources) {
		console.warn(`Failed to push event "${eventID}": no trackers initiated`);
		return false;
	}

	return true;
};

interface GoogleAnalyticsInit {
	tagid: string;
	type?: 'gtag' | 'gtm';
};

export const loadGoogleAnalytics = (options: GoogleAnalyticsInit) => {

	const headScript = document.createElement('script');
	headScript.src = `https://www.googletagmanager.com/gtag/js?id=${options.tagid}`;
	headScript.async = true;

	document.head.appendChild(headScript);

	window.dataLayer = window.dataLayer || [];

	if (options?.type === 'gtm') {
		window.dataLayer.push({
			'gtm.start': new Date().getTime(),
			'event': 'gtm.js'
		});
	}
	else {
		
		window.gtag = function () {
			window.dataLayer!.push(arguments);
		};

		window.gtag('js', new Date());
		window.gtag('config', options.tagid);
	}
};

interface MetaPixelInit {
	pixelID: string;
}

export const loadMetaPixel = (options: MetaPixelInit) => {

	if (window.fbq) {
		console.warn('Repeated call to Meta Pixel loader');
		return;
	}
	
	const headScript = document.createElement('script');
	headScript.src = `https://connect.facebook.net/en_US/fbevents.js`;
	headScript.async = true;

	document.head.appendChild(headScript);

	type MetaFbqMeta = {
		version: string;
		push: Function;
		queue: object[];
		loaded: boolean;
		callMethod: Function;
	};

	const pixel: MetaFbqFunction & Partial<MetaFbqMeta> = function () {
		pixel.callMethod ? pixel.callMethod.apply(pixel, arguments) : pixel!.queue!.push(arguments)
	};

	pixel.push = pixel as MetaFbqFunction;
	pixel.loaded = true;
	pixel.version = '2.0';
	pixel.queue = [];

	window._fbq = pixel as MetaFbqFunction;
	window.fbq = pixel as MetaFbqFunction;

	pixel('init', options.pixelID);
	pixel('track', 'PageView');

};