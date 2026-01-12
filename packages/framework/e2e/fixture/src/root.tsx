import type { ReactNode } from "react";

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>E2E Test Fixture</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
