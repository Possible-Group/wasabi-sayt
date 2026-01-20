import "@/styles/globals.css";
import "@/styles/admin.css";
import AdminShell from "./AdminShell";
import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
