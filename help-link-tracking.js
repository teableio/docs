(function () {
  if (window.__teableHelpLinkTrackingInitialized) {
    return;
  }
  window.__teableHelpLinkTrackingInitialized = true;

  var officialHosts = ["teable.ai", "www.teable.ai", "teable.cn", "www.teable.cn"];
  var locales = ["en", "zh", "ru", "de", "fr", "es", "it", "ja", "tr", "uk", "ar"];
  // Keep this public product catalog in sync with the website arrival validator.
  var productRoutes = [
  "products",
  "csv-compare",
  "email-permutator",
  "pdf-to-table",
  "ai-flowchart-generator",
  "lead-enrichment",
  "ai-market-research",
  "seo-reporting-tool",
  "ai-email-reply-generator",
  "online-database-builder",
  "ai-newsletter-generator",
  "client-portal",
  "purchase-order-generator",
  "ai-social-media-manager",
  "ai-ads-agency",
  "ai-proposal-generator",
  "vendor-portal",
  "directory-website-builder",
  "ai-spreadsheet-generator",
  "employee-portal",
  "ai-report-generator",
  "dashboard-creator",
  "ai-app-builder",
  "no-code-app-builder",
  "excel-to-app",
  "spreadsheet-to-app",
  "online-form-builder",
  "ai-web-scraper",
  "ai-email-parser",
  "find-influencers",
  "workflow-generator",
  "ai-project-management",
  "ctms-system",
];

  function publicSegments(pathname) {
    if (pathname.length > 100 || !/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?$/.test(pathname)) {
      return null;
    }
    return pathname.replace(/\/$/, "").slice(1).split("/");
  }

  function linkCategory(pathname) {
    var parts = publicSegments(pathname);
    if (!parts) { return null; }
    if (locales.indexOf(parts[0]) !== -1) { parts.shift(); }
    if (parts.length === 1 && productRoutes.indexOf(parts[0]) !== -1) { return "product"; }
    if (parts.length <= 2 && parts[0] === "compare") { return "compare"; }
    if (parts.length <= 2 && parts[0] === "blog") { return "blog"; }
    if (parts.length <= 2 && parts[0] === "customers") { return "customer"; }
    return null;
  }

  function trustedTarget(link) {
    try {
      var target = new URL(link.href, window.location.href);
      if (target.protocol !== "https:" || target.port || target.username || target.password ||
          officialHosts.indexOf(target.hostname) === -1 || !linkCategory(target.pathname)) {
        return null;
      }
      return target;
    } catch (_) {
      return null;
    }
  }

  function prepareLink(link) {
    if (!trustedTarget(link)) {
      return;
    }
    var tokens = (link.getAttribute("rel") || "").split(/\s+/).filter(function (token) {
      return token && token.toLowerCase() !== "noreferrer";
    });
    if (!tokens.some(function (token) { return token.toLowerCase() === "noopener"; })) {
      tokens.push("noopener");
    }
    var rel = tokens.join(" ");
    if (link.getAttribute("rel") !== rel) {
      link.setAttribute("rel", rel);
    }
  }

  function prepareTree(root) {
    if (root.matches && root.matches("a[href]")) {
      prepareLink(root);
    }
    if (root.querySelectorAll) {
      root.querySelectorAll("a[href]").forEach(prepareLink);
    }
  }

  // Mintlify inserts and updates links as users navigate between documents.
  prepareTree(document);
  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "attributes") {
        prepareLink(mutation.target);
      } else {
        mutation.addedNodes.forEach(prepareTree);
      }
    });
  }).observe(document.documentElement, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["href", "rel"]
  });
})();
