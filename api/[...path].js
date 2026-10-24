export const config = {
  api: { bodyParser: false },
};

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export default async function handler(request, response) {
  const backendUrl = process.env.COUNTERPOINT_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    response.status(503).json({ detail: "The counterpoint-api service binding is unavailable." });
    return;
  }

  try {
    const incomingUrl = new URL(request.url || "/api", "http://vercel.local");
    const destination = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      backendUrl,
    );
    const headers = new Headers();
    for (const [name, value] of Object.entries(request.headers)) {
      if (!hopByHopHeaders.has(name.toLowerCase()) && value !== undefined) {
        headers.set(name, Array.isArray(value) ? value.join(", ") : value);
      }
    }
    const proxyToken = process.env.BACKEND_PROXY_TOKEN;
    if (proxyToken) headers.set("x-counterpoint-proxy-token", proxyToken);

    const method = request.method || "GET";
    let body;
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      body = Buffer.concat(chunks);
    }

    const upstream = await fetch(destination, {
      method,
      headers,
      body,
      redirect: "manual",
    });

    response.status(upstream.status);
    for (const [name, value] of upstream.headers) {
      const normalizedName = name.toLowerCase();
      if (normalizedName === "set-cookie" || hopByHopHeaders.has(normalizedName)) {
        continue;
      }
      response.setHeader(name, value);
    }

    const cookies = upstream.headers.getSetCookie?.();
    if (cookies?.length) response.setHeader("set-cookie", cookies);

    if (method === "HEAD" || upstream.status === 204 || upstream.status === 304) {
      response.end();
      return;
    }
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    response.status(502).json({
      detail: "The API service could not be reached. Check the Vercel service deployment.",
    });
  }
}
