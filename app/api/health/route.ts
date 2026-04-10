import { NextResponse } from "next/server";

async function checkEndpoint(
  name: string,
  url: string,
  init?: RequestInit
): Promise<{ name: string; ok: boolean; ms: number; error?: string }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);
    return { name, ok: res.ok, ms: Date.now() - start };
  } catch (err) {
    return {
      name,
      ok: false,
      ms: Date.now() - start,
      error: (err as Error).message,
    };
  }
}

export async function GET() {
  const headers = {
    "Content-Type": "application/json;charset=UTF-8",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    Origin: "https://www.daisomall.co.kr",
    Referer: "https://www.daisomall.co.kr/",
  };

  const checks = await Promise.all([
    checkEndpoint(
      "daiso-stores",
      "https://www.daisomall.co.kr/api/ms/msg/selStr",
      {
        method: "POST",
        headers,
        body: JSON.stringify({ searchStrNm: "강남" }),
      }
    ),
    checkEndpoint(
      "daiso-products",
      "https://www.daisomall.co.kr/ssn/search/SearchGoods?searchTerm=건전지&pageIdx=1&pageSize=1&sortType=POPULAR",
      { headers: { "User-Agent": headers["User-Agent"], Referer: headers.Referer } }
    ),
    checkEndpoint(
      "daiso-inventory",
      "https://www.daisomall.co.kr/api/pd/pdh/selStrPkupStck",
      {
        method: "POST",
        headers,
        body: JSON.stringify([{ pdNo: "1039566", strCd: "10803" }]),
      }
    ),
    checkEndpoint(
      "coupang-mcp",
      "https://yuju777-coupang-mcp.hf.space/mcp",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 0,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "health-check", version: "1.0.0" },
          },
        }),
      }
    ),
  ]);

  const allOk = checks.every((c) => c.ok);

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
