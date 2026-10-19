import { InitPasswordView } from "@/views/init-password/InitPasswordView";

/** Tout paramètre `username` est ignoré : l'identifiant vient du cookie d'activation (P2). */
export default async function Page({ searchParams }: PageProps<"/init-password">) {
  const { redirect } = await searchParams;
  return <InitPasswordView requestedRedirect={typeof redirect === "string" ? redirect : undefined} />;
}
