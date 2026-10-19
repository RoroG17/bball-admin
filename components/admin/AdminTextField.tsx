"use client";

import { useAdminFormContext } from "@/components/admin/adminFormContext";
import { TextField, type TextFieldProps } from "@/components/ui/TextField";

type AdminTextFieldProps = Omit<TextFieldProps, "error">;

/**
 * `TextField` relié à l'état du formulaire : erreur du champ, saisie renvoyée par l'action (ré-appliquée par la `key`),
 * lecture seule pendant l'envoi (un champ désactivé ne serait pas envoyé).
 */
export function AdminTextField({ name, defaultValue, readOnly, ...rest }: AdminTextFieldProps) {
  const form = useAdminFormContext();
  const failed = form?.state.status === "error" ? form.state : null;
  const returned = failed?.values[name];

  return (
    <TextField
      key={returned === undefined ? "initial" : `returned:${returned}`}
      name={name}
      defaultValue={returned ?? defaultValue}
      error={failed?.fieldErrors[name]}
      readOnly={readOnly || form?.pending}
      {...rest}
    />
  );
}
