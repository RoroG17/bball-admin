"use client";

import { useAdminFormContext } from "@/components/admin/adminFormContext";
import { SelectField, type SelectFieldProps } from "@/components/ui/SelectField";

type AdminSelectFieldProps = Omit<SelectFieldProps, "error">;

/** `SelectField` relié à l'état du formulaire : erreur du champ et valeur renvoyée par l'action. */
export function AdminSelectField({ name, defaultValue, ...rest }: AdminSelectFieldProps) {
  const form = useAdminFormContext();
  const failed = form?.state.status === "error" ? form.state : null;
  const returned = failed?.values[name];

  return (
    <SelectField
      key={returned === undefined ? "initial" : `returned:${returned}`}
      name={name}
      defaultValue={returned ?? defaultValue}
      error={failed?.fieldErrors[name]}
      {...rest}
    />
  );
}
