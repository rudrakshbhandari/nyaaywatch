/** @type {import('@lhci/cli').LhciConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        "http://127.0.0.1:4211/",
        "http://127.0.0.1:4211/districts",
        "http://127.0.0.1:4211/districts/kangra",
        "http://127.0.0.1:4211/methodology",
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--no-sandbox --headless",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-byte-weight": ["warn", { maxNumericValue: 200000 }],
        "unused-javascript": ["warn", { maxLength: 2 }],
        "uses-text-compression": ["warn", { maxLength: 2 }],
        "render-blocking-resources": ["warn", { maxLength: 3 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
