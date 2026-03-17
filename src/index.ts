const hostMatch: RegExp = /consumer.*\.turquoise\.health/;

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
			text.replace(this.buffer.replace(hostMatch, this.currentHost))
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

		try {
			const response = await fetch(request);
			if (hostMatch.test(currentHost)) {
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
