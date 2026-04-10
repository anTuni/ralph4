const DAISO_BASE = "https://www.daisomall.co.kr";

export interface DaisoStore {
  strCd: string;
  strNm: string;
  strAddr: string;
  strLitd: number; // longitude
  strLttd: number; // latitude
  opngTime: string;
  clsngTime: string;
  km: string;
  pkupYn: string;
}

export interface DaisoProduct {
  pdNo: string;
  pdNm: string;
  pdPrc: string;
  exhLargeCtgrNm: string;
  exhMiddleCtgrNm: string;
  exhSmallCtgrNm: string;
  soldOutYn: string;
  pdImgUrl: string;
  avgStscVal: string;
  revwCnt: string;
}

export interface DaisoInventory {
  pdNo: string;
  strCd: string;
  stck: string;
  sleStsCd: string;
}

export async function searchStores(keyword: string): Promise<DaisoStore[]> {
  const res = await fetch(`${DAISO_BASE}/api/ms/msg/selStr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      Origin: DAISO_BASE,
      Referer: `${DAISO_BASE}/`,
    },
    body: JSON.stringify({ searchStrNm: keyword }),
  });

  if (!res.ok) throw new Error(`Store search failed: ${res.status}`);
  const data = await res.json();
  return data.data ?? [];
}

export async function searchProducts(
  keyword: string,
  pageSize = 5
): Promise<DaisoProduct[]> {
  const params = new URLSearchParams({
    searchTerm: keyword,
    pageIdx: "1",
    pageSize: String(pageSize),
    sortType: "POPULAR",
  });

  const res = await fetch(
    `${DAISO_BASE}/ssn/search/SearchGoods?${params.toString()}`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        Referer: `${DAISO_BASE}/`,
      },
    }
  );

  if (!res.ok) throw new Error(`Product search failed: ${res.status}`);
  const data = await res.json();

  const results = data.resultSet?.result;
  if (!results || results.length < 2) return [];

  return results[1]?.resultDocuments ?? [];
}

export async function checkInventory(
  strCd: string,
  pdNo: string
): Promise<DaisoInventory | null> {
  const res = await fetch(`${DAISO_BASE}/api/pd/pdh/selStrPkupStck`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
      Origin: DAISO_BASE,
      Referer: `${DAISO_BASE}/`,
    },
    body: JSON.stringify([{ pdNo, strCd }]),
  });

  if (!res.ok) throw new Error(`Inventory check failed: ${res.status}`);
  const data = await res.json();

  if (!data.success || !data.data?.length) return null;
  return data.data[0];
}

export function distanceBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
