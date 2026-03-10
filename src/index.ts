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
		// existing request is immutable, clone it to change the URL and headers
		const newRequest = new Request(sitemapUrl, request);
		newRequest.headers.set("cf-access-client-id", env.CF_ACCESS_CLIENT_ID);
		newRequest.headers.set("cf-access-client-secret", env.CF_ACCESS_CLIENT_SECRET);

		try {
			const response = await fetch(newRequest);
			const rewriter = new HTMLRewriter().on("loc", new UrlRewriter())
			return rewriter.transform(response)
		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), {
				status: 500,
			});
		}
	},
};