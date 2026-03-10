const sitemapUrl = "https://marketing.turquoise.health/sitemap.xml";
const replaceHost = "marketing.turquoise.health"

class UrlRewriter {
	buffer: string;
	currentHost: string;

	constructor(currentHost: string) {
		this.currentHost = currentHost;
		this.buffer = '';
	}

	element(element: Element) {
		this.buffer = '';
	}

	text(text: Text) {
		this.buffer += text.text

		if (text.lastInTextNode) {
			// We're done with this text node -- search and replace and reset.
			text.replace(this.buffer.replace(replaceHost, this.currentHost))
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
		const url = URL.parse(request.url),
			currentHost = url?.host ?? "turquoise.health";

		// existing request is immutable, clone it to change the URL and headers
		const newRequest = new Request(sitemapUrl, request);
		newRequest.headers.set("cf-access-client-id", env.CF_ACCESS_CLIENT_ID);
		newRequest.headers.set("cf-access-client-secret", env.CF_ACCESS_CLIENT_SECRET);

		try {
			const response = await fetch(newRequest);
			if (currentHost === replaceHost) {
				return response
			}

			// rewrite the URLs in the text portion of the `<loc>` elements
			const rewriter = new HTMLRewriter().on("loc", new UrlRewriter(currentHost));
			return rewriter.transform(response);
		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), {
				status: 500,
			});
		}
	},
};