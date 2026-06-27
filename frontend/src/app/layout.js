import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import ClientAppShell from "./components/ClientAppShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Nexus AI - Command Center",
  description: "One platform. Six superpowers. Zero context-switching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <ClientAppShell>{children}</ClientAppShell>
      </body>
    </html>
  );
}
