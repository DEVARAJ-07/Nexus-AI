import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "OutPost CI/CD Platform - Beta",
  description: "Minimalist, concurrent developer CI/CD orchestration engine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <div className="app-container">
          <Navbar />
          <main style={{ flexGrow: 1 }}>{children}</main>
          <footer className="footer-metadata hairline-top">
            <div>
              <strong>SYSTEM METRICS</strong>
              <br />
              CPU USAGE: 12.4%
              <br />
              MEMORY: 4.2GB / 16GB
            </div>
            <div>
              <strong>RUNNERS</strong>
              <br />
              ACTIVE NODES: 8 / 10
              <br />
              QUEUE DEPTH: 0 JOBS
            </div>
            <div>
              <strong>DOCUMENTATION</strong>
              <br />
              <a href="#" className="footer-link">API SPECIFICATION</a>
              <br />
              <a href="#" className="footer-link">CLI DOCUMENTATION</a>
            </div>
            <div className="oversized-footer-version">
              OUTPOST v0.8.2
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
