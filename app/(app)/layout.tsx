import { AppShellView } from "@/views/app-shell/AppShellView";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShellView>{children}</AppShellView>;
}
