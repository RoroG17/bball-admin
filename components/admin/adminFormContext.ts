"use client";

import { createContext, useContext } from "react";
import type { FormState } from "@/models/FormState";

export type AdminFormContextValue = { state: FormState<string>; pending: boolean };

/** État du formulaire courant, lu par les champs (`AdminTextField`, `AdminSelectField`, champs propres aux features). */
export const AdminFormContext = createContext<AdminFormContextValue | null>(null);

export function useAdminFormContext(): AdminFormContextValue | null {
  return useContext(AdminFormContext);
}
