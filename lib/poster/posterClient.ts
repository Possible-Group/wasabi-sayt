import "server-only";

const POSTER_TOKEN = process.env.POSTER_TOKEN || process.env.POSTER_ACCESS_TOKEN;
const POSTER_BASE_URL = process.env.POSTER_BASE_URL;

function need(name: string, v?: string) {
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

type PosterHttpMethod = "GET" | "POST";

type PosterFetchOptions = {
  httpMethod?: PosterHttpMethod;
};

export async function posterFetch<T>(
  method: string,
  params: Record<string, string | number | boolean | undefined> = {},
  options: PosterFetchOptions = {}
): Promise<T> {
  const token = need("POSTER_TOKEN", POSTER_TOKEN);
  const base = need("POSTER_BASE_URL", POSTER_BASE_URL).replace(/\/$/, "");
  const httpMethod = options.httpMethod ?? "GET";

  const url = new URL(`${base}/${method}`);
  url.searchParams.set("token", token);
  url.searchParams.set("format", "json");

  const requestInit: RequestInit = { cache: "no-store", method: httpMethod };
  if (httpMethod === "GET") {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  } else {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) body.set(k, String(v));
    }
    requestInit.headers = {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    };
    requestInit.body = body.toString();
  }

  const res = await fetch(url.toString(), requestInit);
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`Poster error ${res.status}: ${text || res.statusText}`);

  const json = text ? JSON.parse(text) : {};
  if (json?.error) {
    const detail =
      typeof json.error === "object" ? JSON.stringify(json.error) : String(json.error);
    const message = json?.message ? ` ${json.message}` : "";
    throw new Error(`Poster API error: ${detail}${message}`);
  }
  return json as T;
}
