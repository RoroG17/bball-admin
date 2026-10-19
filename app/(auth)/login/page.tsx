import { LoginView } from "@/views/login/LoginView";

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { redirect, reason } = await searchParams;
  return (
    <LoginView
      requestedRedirect={typeof redirect === "string" ? redirect : undefined}
      requestedReason={typeof reason === "string" ? reason : undefined}
    />
  );
}
