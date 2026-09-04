(function () {
  var locales = ["en", "zh", "ru", "de", "fr", "es", "it", "ja", "tr", "uk", "ar"];
  var localeCookie = "TEABLE_DOCS_LOCALE";
  var routerPath = "/en/locale-router";
  var overviewPath = "/basic/ai/overview";

  function localeFromPath(pathname) {
    var firstSegment = pathname.split("/")[1].toLowerCase();
    return locales.indexOf(firstSegment) === -1 ? null : firstSegment;
  }

  function localeFromTag(tag) {
    var normalized = String(tag || "").trim().toLowerCase();

    for (var index = 0; index < locales.length; index += 1) {
      var locale = locales[index];
      if (normalized === locale || normalized.indexOf(locale + "-") === 0) {
        return locale;
      }
    }

    return null;
  }

  function readLocaleCookie() {
    var prefix = localeCookie + "=";
    var cookies = document.cookie.split(";");

    for (var index = 0; index < cookies.length; index += 1) {
      var cookie = cookies[index].trim();
      if (cookie.indexOf(prefix) === 0) {
        return localeFromTag(decodeURIComponent(cookie.slice(prefix.length)));
      }
    }

    return null;
  }

  function writeLocaleCookie(locale) {
    document.cookie =
      localeCookie + "=" + encodeURIComponent(locale) + "; Path=/; Max-Age=31536000; SameSite=Lax";
  }

  function preferredBrowserLocale() {
    var browserLanguages = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (var index = 0; index < browserLanguages.length; index += 1) {
      var locale = localeFromTag(browserLanguages[index]);
      if (locale) {
        return locale;
      }
    }

    return "en";
  }

  function rememberLanguageSwitcherChoice(event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) {
      return;
    }

    var target = new URL(link.href, window.location.origin);
    if (target.origin !== window.location.origin) {
      return;
    }

    var currentLocale = localeFromPath(window.location.pathname);
    var targetLocale = localeFromPath(target.pathname);
    if (currentLocale && targetLocale && currentLocale !== targetLocale) {
      writeLocaleCookie(targetLocale);
    }
  }

  document.addEventListener("click", rememberLanguageSwitcherChoice, true);

  if (window.location.pathname.replace(/\/$/, "") !== routerPath) {
    return;
  }

  var locale = readLocaleCookie() || preferredBrowserLocale();
  window.location.replace(
    "/" + locale + overviewPath + window.location.search + window.location.hash
  );
})();
