import { AdminShellView } from "@/views/admin-shell/AdminShellView";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShellView>{children}</AdminShellView>;
}
