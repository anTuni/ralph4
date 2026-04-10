import { tool } from "ai";
import { z } from "zod";
import {
  searchStores,
  searchProducts,
  checkInventory,
  distanceBetween,
} from "./daiso";
import { searchCoupangProducts } from "./coupang";

export const daisoTools = {
  searchNearbyStores: tool({
    description:
      "사용자의 현재 위치(위도, 경도) 기반으로 가까운 다이소 매장을 검색합니다. 매장명, 주소, 거리, 영업시간을 반환합니다.",
    inputSchema: z.object({
      lat: z
        .number()
        .min(33)
        .max(43)
        .describe("사용자의 위도 (한국 범위: 33-43)"),
      lng: z
        .number()
        .min(124)
        .max(132)
        .describe("사용자의 경도 (한국 범위: 124-132)"),
    }),
    execute: async ({ lat, lng }) => {
      try {
        const stores = await searchStores("");
        if (!stores.length) {
          return { stores: [], message: "근처에 다이소 매장을 찾을 수 없습니다." };
        }

        const sorted = stores
          .map((s) => ({
            storeId: s.strCd,
            name: s.strNm,
            address: s.strAddr,
            distance: Math.round(
              distanceBetween(lat, lng, s.strLttd, s.strLitd) * 1000
            ),
            openTime: s.opngTime,
            closeTime: s.clsngTime,
            pickupAvailable: s.pkupYn === "Y",
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 3);

        return { stores: sorted };
      } catch {
        return {
          stores: [],
          error: "다이소 매장 검색에 실패했습니다. 잠시 후 다시 시도해주세요.",
        };
      }
    },
  }),

  searchProducts: tool({
    description:
      "다이소에서 상품을 검색합니다. 상품명, 가격, 카테고리 정보를 반환합니다.",
    inputSchema: z.object({
      keyword: z
        .string()
        .min(1)
        .max(50)
        .describe("검색할 상품명 (예: AA건전지, 물티슈, 접착제)"),
    }),
    execute: async ({ keyword }) => {
      try {
        const products = await searchProducts(keyword);
        if (!products.length) {
          return {
            products: [],
            message: `"${keyword}"에 대한 검색 결과가 없습니다.`,
          };
        }

        return {
          products: products.slice(0, 5).map((p) => ({
            productId: p.pdNo,
            name: p.pdNm,
            price: `${Number(p.pdPrc).toLocaleString()}원`,
            category: `${p.exhLargeCtgrNm} > ${p.exhMiddleCtgrNm}`,
            categoryHint: p.exhLargeCtgrNm,
            soldOut: p.soldOutYn === "Y",
            rating: p.avgStscVal,
            reviewCount: p.revwCnt,
          })),
        };
      } catch {
        return {
          products: [],
          error: "상품 검색에 실패했습니다. 잠시 후 다시 시도해주세요.",
        };
      }
    },
  }),

  checkInventory: tool({
    description:
      "특정 다이소 매장의 특정 상품 재고를 확인합니다. 재고 수량을 반환합니다.",
    inputSchema: z.object({
      storeId: z
        .string()
        .regex(/^\d{4,6}$/)
        .describe("매장 코드 (예: 10803)"),
      productId: z
        .string()
        .regex(/^\d{5,8}$/)
        .describe("상품 번호 (예: 1039566)"),
    }),
    execute: async ({ storeId, productId }) => {
      try {
        const inventory = await checkInventory(storeId, productId);
        if (!inventory) {
          return {
            inStock: false,
            quantity: 0,
            message: "재고 정보를 확인할 수 없습니다.",
          };
        }

        const qty = parseInt(inventory.stck, 10);
        return {
          inStock: qty > 0,
          quantity: qty,
          saleStatus: inventory.sleStsCd === "1" ? "판매중" : "판매중지",
        };
      } catch {
        return {
          inStock: false,
          quantity: 0,
          error: "재고 확인에 실패했습니다.",
        };
      }
    },
  }),

  findAlternatives: tool({
    description:
      "쿠팡에서 비슷한 대체 상품을 검색합니다. 다이소 재고 유무와 관계없이 항상 호출하여 가격 비교와 대체 상품을 제공합니다. 상품명, 가격, 배송정보를 반환합니다.",
    inputSchema: z.object({
      keyword: z
        .string()
        .min(1)
        .max(50)
        .describe("검색할 상품 키워드 (예: AA건전지, 양면테이프)"),
    }),
    execute: async ({ keyword }) => {
      try {
        const products = await searchCoupangProducts(keyword);
        if (!products.length) {
          return {
            alternatives: [],
            message: "쿠팡 검색이 일시적으로 불가합니다.",
          };
        }

        return {
          alternatives: products,
          message: "쿠팡에서 로켓배송 가능한 대체 상품을 찾았어요!",
        };
      } catch {
        return {
          alternatives: [],
          message: "쿠팡 검색이 일시적으로 불가합니다.",
        };
      }
    },
  }),
};
