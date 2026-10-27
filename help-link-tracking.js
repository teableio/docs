(function () {
  if (window.__teableHelpLinkTrackingInitialized) {
    return;
  }
  window.__teableHelpLinkTrackingInitialized = true;

  var officialHosts = ["teable.ai", "www.teable.ai", "teable.cn", "www.teable.cn"];
  var locales = ["en", "zh", "ru", "de", "fr", "es", "it", "ja", "tr", "uk", "ar"];
  // Keep this public product catalog in sync with the website arrival validator.
  var productRoutes = [
  "customer-feedback-analysis",
  "custom-inventory-management",
  "employee-database",
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

  function sourceContext() {
    var location = window.location;
    if (location.protocol !== "https:" ||
        ["help.teable.ai", "help.teable.cn"].indexOf(location.hostname) === -1) {
      return null;
    }
    var parts = publicSegments(location.pathname);
    if (!parts || locales.indexOf(parts[0]) === -1) { return null; }
    if (parts.length > 1 && ["basic", "deploy", "api-doc", "compare"].indexOf(parts[1]) === -1 &&
        !(parts.length === 2 && /^changelog(?:-\d{4}(?:-\d{2})?)?$/.test(parts[1]))) {
      return null;
    }
    return { path: location.pathname, host: location.hostname };
  }

  function addSourceMarkers(target, source) {
    // Keep existing campaign parameters and their encoding exactly as supplied.
    var original = target.search ? target.search.slice(1).split("&") : [];
    var kept = original.filter(function (entry) {
      try {
        var name = decodeURIComponent(entry.split("=")[0].replace(/\+/g, " "));
        return name !== "help_source" && name !== "help_host";
      } catch (_) { return true; }
    });
    kept.push("help_source=" + encodeURIComponent(source.path));
    kept.push("help_host=" + encodeURIComponent(source.host));
    target.search = "?" + kept.join("&");
  }

  function prepareLink(link) {
    var target = trustedTarget(link);
    if (!target) {
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
    var source = sourceContext();
    if (source) {
      addSourceMarkers(target, source);
      if (link.href !== target.href) { link.setAttribute("href", target.href); }
    }
  }

  function trackClick(event) {
    if ((event.type === "click" && event.button !== 0) ||
        (event.type === "auxclick" && event.button !== 1)) { return; }
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) { return; }
    var target = trustedTarget(link);
    var source = sourceContext();
    if (!target || !source) { return; }
    prepareLink(link);
    var locale = source.path.split("/")[1];
    var parameters = {
      send_to: "G-LQ8H9TEDRD",
      source_path: source.path,
      target_path: target.pathname,
      source_domain: source.host,
      link_category: linkCategory(target.pathname),
      locale: locale,
      page_location: "https://" + source.host + source.path
    };
    // Queue early clicks through the same gtag data layer, without configuring
    // another tag or sending a page_view. Existing consent rules still apply.
    function queueEvent() {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(arguments);
    }
    (typeof window.gtag === "function" ? window.gtag : queueEvent)(
      "event", "teable_help_link_click", parameters
    );
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
  var observedPath = window.location.pathname;
  function refreshForRoute() {
    if (observedPath !== window.location.pathname) {
      observedPath = window.location.pathname;
      prepareTree(document);
    }
  }
  document.addEventListener("click", trackClick, true);
  document.addEventListener("auxclick", trackClick, true);
  window.addEventListener("popstate", refreshForRoute);
  new MutationObserver(function (mutations) {
    refreshForRoute();
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
