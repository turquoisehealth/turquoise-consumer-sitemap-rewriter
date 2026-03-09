import env from "cloudflare:workers";

const sitemapUrl = "https://marketing.turquoise.health/sitemap.xml";

export default {
	async fetch(request: Request) {
		function MethodNotAllowed(request: Request) {
			return new Response(`Method ${request.method} not allowed.`, {
				status: 405,
				headers: {
					Allow: "GET",
				},
			});
		}
		// Only GET requests work with this proxy.
		if (request.method !== "GET") return MethodNotAllowed(request);

		// Best practice is to always use the original request to construct the new request
		// to clone all the attributes. Applying the URL also requires a constructor
		// since once a Request has been constructed, its URL is immutable.
		const newRequest = new Request(sitemapUrl, request);

		newRequest.headers.set("cf-access-client-id", env.CF_ACCESS_CLIENT_ID);
		newRequest.headers.set("cf-access-client-secret", env.CF_ACCESS_CLIENT_SECRET);

		try {
			const response = await fetch(newRequest);

			// Copy over the response
			const modifiedResponse = new Response(response.body, response);

			// Delete the set-cookie from the response so it doesn't override existing cookies
			modifiedResponse.headers.delete("set-cookie");

			return modifiedResponse;
		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), {
				status: 500,
			});
		}
	},
};