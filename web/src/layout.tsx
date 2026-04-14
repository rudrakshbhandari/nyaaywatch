import React, { type ReactNode } from "react";

export interface LayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function Layout({ title, description, children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="stylesheet" href="/static/styles.css" />
      </head>
      <body>
        <div className="site-shell">
          <header className="site-header">
            <a className="brand" href="/">
              <span className="brand-mark">NyaayWatch</span>
              <span className="brand-subtitle">Published snapshot observatory for Himachal Pradesh</span>
            </a>
            <nav className="header-links" aria-label="Utility links">
              <a href="/v1/stats/himachal">State JSON</a>
              <a href="/v1/districts/mandi">District JSON</a>
              <a href="/districts/mandi">District evidence</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
