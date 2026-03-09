export default {
	async fetch(request: Request): Promise<Response> {
		const remote = "https://marketing.turquoise.health/sitemap.xml";
		return await fetch(remote, request);
	},
};
