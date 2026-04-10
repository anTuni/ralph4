const COUPANG_MCP_URL = "https://yuju777-coupang-mcp.hf.space/mcp";
const TIMEOUT_MS = 10_000;

export interface CoupangProduct {
  name: string;
  price: string;
  deliveryType: string;
  link: string;
}

export async function searchCoupangProducts(
  keyword: string
): Promise<CoupangProduct[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Initialize session
    const initRes = await fetch(COUPANG_MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "ralph4", version: "1.0.0" },
        },
      }),
      signal: controller.signal,
    });

    if (!initRes.ok) throw new Error(`MCP init failed: ${initRes.status}`);
    const sessionId = initRes.headers.get("mcp-session-id");

    // Search products
    const searchRes = await fetch(COUPANG_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "search_coupang_products",
          arguments: { keyword, limit: 3 },
        },
      }),
      signal: controller.signal,
    });

    if (!searchRes.ok) throw new Error(`MCP search failed: ${searchRes.status}`);
    const data = await searchRes.json();

    const content = data.result?.content;
    if (!content?.length) return [];

    const text = content[0]?.text ?? "";

    // Parse the text response into products
    return parseProducts(text);
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.warn("Coupang search timed out");
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function parseProducts(text: string): CoupangProduct[] {
  const products: CoupangProduct[] = [];
  const lines = text.split("\n");

  let current: Partial<CoupangProduct> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("상품명:") || trimmed.startsWith("- 상품명:")) {
      if (current.name) products.push(current as CoupangProduct);
      current = { name: trimmed.replace(/^-?\s*상품명:\s*/, "") };
    } else if (trimmed.startsWith("가격:") || trimmed.startsWith("- 가격:")) {
      current.price = trimmed.replace(/^-?\s*가격:\s*/, "");
    } else if (trimmed.startsWith("배송:") || trimmed.startsWith("- 배송:")) {
      current.deliveryType = trimmed.replace(/^-?\s*배송:\s*/, "");
    } else if (trimmed.startsWith("링크:") || trimmed.startsWith("- 링크:")) {
      current.link = trimmed.replace(/^-?\s*링크:\s*/, "");
    } else if (trimmed.includes("coupang.com")) {
      current.link = trimmed;
    }
  }
  if (current.name) products.push(current as CoupangProduct);

  return products.slice(0, 3);
}
