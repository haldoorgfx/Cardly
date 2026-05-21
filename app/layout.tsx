import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://karta.cre8so.com"),
  title: "Karta — Your design. Their personalization. One link.",
  description:
    "Upload your event design, define editable zones, and share one link. Attendees personalize and download their own version.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
