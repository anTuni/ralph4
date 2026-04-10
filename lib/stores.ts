export interface StoreLoc {
  strCd: string;
  name: string;
  addr: string;
  lat: number;
  lng: number;
  open: string;
  close: string;
}

// 주요 다이소 매장 좌표 (서울·수도권)
export const STORES: StoreLoc[] = [
  { strCd: "10224", name: "강남역2호점", addr: "서울 강남구 강남대로 396", lat: 37.4979, lng: 127.0276, open: "10:00", close: "22:00" },
  { strCd: "10803", name: "매봉역점", addr: "서울 강남구 남부순환로 2748", lat: 37.4866, lng: 127.0472, open: "10:00", close: "22:00" },
  { strCd: "10180", name: "명동역점", addr: "서울 중구 명동길 52", lat: 37.5636, lng: 126.9850, open: "10:00", close: "22:00" },
  { strCd: "10234", name: "홍대점", addr: "서울 마포구 양화로 153", lat: 37.5563, lng: 126.9236, open: "10:00", close: "22:00" },
  { strCd: "10312", name: "신촌역점", addr: "서울 서대문구 신촌로 73", lat: 37.5553, lng: 126.9368, open: "10:00", close: "22:00" },
  { strCd: "10456", name: "잠실역점", addr: "서울 송파구 올림픽로 240", lat: 37.5133, lng: 127.1001, open: "10:00", close: "22:00" },
  { strCd: "10567", name: "영등포역점", addr: "서울 영등포구 경인로 846", lat: 37.5159, lng: 126.9076, open: "10:00", close: "22:00" },
  { strCd: "10678", name: "건대입구역점", addr: "서울 광진구 아차산로 272", lat: 37.5406, lng: 127.0691, open: "10:00", close: "22:00" },
  { strCd: "10789", name: "왕십리역점", addr: "서울 성동구 왕십리로 210", lat: 37.5612, lng: 127.0380, open: "10:00", close: "22:00" },
  { strCd: "10890", name: "노원역점", addr: "서울 노원구 상계로 64", lat: 37.6553, lng: 127.0613, open: "10:00", close: "22:00" },
  { strCd: "10123", name: "서울역점", addr: "서울 용산구 한강대로 405", lat: 37.5547, lng: 126.9707, open: "10:00", close: "22:00" },
  { strCd: "10345", name: "구로디지털단지역점", addr: "서울 구로구 디지털로 300", lat: 37.4854, lng: 126.9015, open: "10:00", close: "22:00" },
  { strCd: "10456", name: "사당역점", addr: "서울 동작구 동작대로 109", lat: 37.4766, lng: 126.9816, open: "10:00", close: "22:00" },
  { strCd: "10512", name: "수원역점", addr: "경기 수원시 팔달구 덕영대로 924", lat: 37.2660, lng: 127.0016, open: "10:00", close: "22:00" },
  { strCd: "10623", name: "부평역점", addr: "인천 부평구 부평대로 38", lat: 37.4903, lng: 126.7234, open: "10:00", close: "22:00" },
  { strCd: "10734", name: "일산점", addr: "경기 고양시 일산동구 중앙로 1036", lat: 37.6584, lng: 126.7714, open: "10:00", close: "22:00" },
  { strCd: "10845", name: "분당서현역점", addr: "경기 성남시 분당구 서현로 180", lat: 37.3845, lng: 127.1209, open: "10:00", close: "22:00" },
  { strCd: "10956", name: "판교역점", addr: "경기 성남시 분당구 판교역로 146", lat: 37.3947, lng: 127.1113, open: "10:00", close: "22:00" },
];

export function findNearbyStores(lat: number, lng: number, limit = 3): (StoreLoc & { distance: number })[] {
  return STORES
    .map((s) => ({
      ...s,
      distance: Math.round(haversine(lat, lng, s.lat, s.lng) * 1000), // meters
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
