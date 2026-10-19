import { z } from "zod";
import { numeric } from "@/repositories/dto/numeric";
import type { Page } from "@/models/Page";

/**
 * Enveloppe de `paginate()` de Laravel. Les autres clés (`links`, `*_page_url`, `from`, `to`, `path`) sont ignorées :
 * elles contiennent des URL du back et ne sont jamais exposées au navigateur.
 */
export function paginatedDto<S extends z.ZodType>(item: S) {
  return z.object({
    current_page: numeric,
    data: z.array(item),
    last_page: numeric,
    per_page: numeric,
    total: numeric,
  });
}

type PaginatedShape<T> = { current_page: number; data: T[]; last_page: number; per_page: number; total: number };

/** DTO paginé → `Page` du modèle (`pageCount ≥ 1` même vide). */
export function toPage<T, U>(dto: PaginatedShape<T>, mapItem: (raw: T) => U): Page<U> {
  return {
    items: dto.data.map(mapItem),
    page: dto.current_page,
    pageCount: Math.max(1, dto.last_page),
    total: dto.total,
    perPage: dto.per_page,
  };
}
