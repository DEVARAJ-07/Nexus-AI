import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import TransitionProvider from "./components/TransitionProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Outpost AI - Business Command Center",
  description: "One platform. Six superpowers. Zero context-switching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body>
        <div className="app-shell">
          <Navbar />
          <div className="main-area">
            <header className="topbar">
              <div className="topbar-title">Outpost Command Center</div>
              <div className="topbar-meta">V.0.1</div>
            </header>
            <main className="content-container">
              <TransitionProvider>{children}</TransitionProvider>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
