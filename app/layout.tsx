import type { Metadata } from "next";
import Sidebar from "./components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Agent Monitor",
  description: "Live view of Claude Code and Codex sessions and their agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
