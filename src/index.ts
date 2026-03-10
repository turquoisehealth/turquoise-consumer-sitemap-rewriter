const sitemapUrl = "https://marketing.turquoise.health/sitemap.xml";

class UrlRewriter {
	buffer: string;

	element(element: Element) {
		this.buffer = '';
	}
	text(text: Text) {
		this.buffer += text.text

		if (text.lastInTextNode) {
			// We're done with this text node -- search and replace and reset.
			text.replace(this.buffer.replace("marketing.turquoise.health", "turquoise.health"))
			this.buffer = ''
		} else {
			// This wasn't the last text chunk, and we don't know if this chunk
			// will participate in a match. We must remove it so the client
			// doesn't see it.
			text.remove()
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		// Best practice is to always use the original request to construct the new request
		// to clone all the attributes. Applying the URL also requires a constructor
		// since once a Request has been constructed, its URL is immutable.
		const newRequest = new Request(sitemapUrl, request);

		newRequest.headers.set("cf-access-client-id", env.CF_ACCESS_CLIENT_ID);
		newRequest.headers.set("cf-access-client-secret", env.CF_ACCESS_CLIENT_SECRET);

		try {
			const response = await fetch(newRequest);
			const rewriter = new HTMLRewriter().on("loc", new UrlRewriter())
			const modifiedResponse = rewriter.transform(response)
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