window.addEventListener('load', () => {
	window.SwaggerUIBundle({
		url: '../openapi.json',
		dom_id: '#swagger-ui',
		validatorUrl: null,
		supportedSubmitMethods: [],
		queryConfigEnabled: false,
		layout: 'BaseLayout',
	});
});
