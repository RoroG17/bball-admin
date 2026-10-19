"use client";

import { catchError } from "next/error";
import { BlockErrorFallback } from "@/components/ui/BlockErrorFallback";

/**
 * Isole les erreurs d'un bloc : le reste de la page reste affiché.
 * `redirect()` et `notFound()` ne sont pas interceptés.
 */
export const BlockErrorBoundary = catchError(BlockErrorFallback);
