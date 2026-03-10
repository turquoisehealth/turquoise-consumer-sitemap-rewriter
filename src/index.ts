const sitemapUrl = "https://marketing.turquoise.health/sitemap.xml";

class UrlRewriter {
	buffer: string;
	newHost: string;

	constructor(newHost: string) {
		this.newHost = newHost;
		console.log(`constructor: ${this.newHost}`);
		this.buffer = '';
	}

	element(element: Element) {
		this.buffer = '';
	}
	text(text: Text) {
		this.buffer += text.text

		if (text.lastInTextNode) {
			// We're done with this text node -- search and replace and reset.
			console.log(this.newHost);
			text.replace(this.buffer.replace("marketing.turquoise.health", this.newHost))
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
		const url = URL.parse(request.url);
		console.log("fetch")
		console.log(request.url);
		console.log(url);
		console.log(url?.host);
		console.log("start")
		// existing request is immutable, clone it to change the URL and headers
		const newRequest = new Request(sitemapUrl, request);
		newRequest.headers.set("cf-access-client-id", env.CF_ACCESS_CLIENT_ID);
		newRequest.headers.set("cf-access-client-secret", env.CF_ACCESS_CLIENT_SECRET);

		try {
			const response = await fetch(newRequest);
			const rewriter = new HTMLRewriter().on("loc", new UrlRewriter(url?.host ?? "turquoise.health"))
			return rewriter.transform(response)
		} catch (e) {
			return new Response(JSON.stringify({ error: e.message }), {
				status: 500,
			});
		}
	},
};