(function () {
  var pairs = [];
  var activeId = null;
  var scrollScheduled = false;
  var refreshTimer = null;
  var lazyVideoObserver = null;
  var monthReader = null;

  function isChangelogPage() {
    return /\/changelog(?:-\d{4}(?:-\d{2})?)?\/?$/.test(window.location.pathname);
  }

  function syncCurrentPath() {
    document.documentElement.setAttribute("data-current-path", window.location.pathname);
  }

  function redirectHistoricalAnchor() {
    if (!/\/changelog\/?$/.test(window.location.pathname) || !window.location.hash) {
      return;
    }
    var anchor;
    try {
      anchor = decodeURIComponent(window.location.hash.slice(1));
    } catch (_) {
      return;
    }
    if (document.getElementById(anchor)) {
      return;
    }
    var histories = document.querySelectorAll("[data-changelog-month][data-changelog-anchors]");
    for (var index = 0; index < histories.length; index += 1) {
      if (histories[index].getAttribute("data-changelog-anchors").split("|").indexOf(anchor) !== -1) {
        var path = window.location.pathname.replace(/\/changelog\/?$/, "/changelog-" + histories[index].getAttribute("data-changelog-month"));
        window.location.replace(path + window.location.search + "#" + encodeURIComponent(anchor));
        return;
      }
    }
  }

  function clearActiveState() {
    document.querySelectorAll("#table-of-contents .toc-item[data-changelog-active]").forEach(function (item) {
      item.removeAttribute("data-changelog-active");
      var link = item.querySelector("a");
      if (link) {
        link.removeAttribute("aria-current");
      }
    });
    activeId = null;
  }

  function normalizeNavigationHeadings() {
    // Hosted Mintlify adds navigation headings that older local previews omit.
    document.querySelectorAll('[data-agent-docs-index] h2, #table-of-contents h2, #navigation-items h5').forEach(function (heading) {
      var label = document.createElement("div");
      Array.from(heading.attributes).forEach(function (attribute) {
        if (attribute.name !== "role" && attribute.name !== "aria-level") {
          label.setAttribute(attribute.name, attribute.value);
        }
      });
      // Move the button itself so its click handler and aria-labelledby survive.
      while (heading.firstChild) label.appendChild(heading.firstChild);
      heading.replaceWith(label);
    });
  }

  function setupHeadingLinks() {
    var nativeLink = document.querySelectorAll('#content .group a.group\\/link')[0];
    if (!nativeLink) return;
    document.querySelectorAll('[data-component-part="update-content"] h2[id], [data-component-part="update-content"] h3[id]').forEach(function (heading) {
      var wrapper = heading.querySelector('a.group\\/link');
      if (wrapper) wrapper = wrapper.parentElement;
      else {
        wrapper = nativeLink.parentElement.cloneNode(true);
        heading.prepend(wrapper);
      }
      var identity = heading.getAttribute("data-title-anchor");
      if (!identity) {
        var previous = heading.previousElementSibling;
        if (previous && previous.tagName === "SPAN" && previous.id && !/^(?:release-)?\d{4}-/.test(previous.id)) identity = previous.id;
        else identity = heading.textContent.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, "-");
        if (!identity) identity = heading.id;
        var existing = document.getElementById(identity);
        if (existing && existing !== previous && existing !== heading) identity += "-" + heading.id;
        if (!document.getElementById(identity)) {
          var anchor = document.createElement("span");
          anchor.id = identity;
          anchor.className = "changelog-title-anchor";
          heading.before(anchor);
        }
        heading.setAttribute("data-title-anchor", identity);
      }
      var source = heading.closest("[data-changelog-source]");
      var path = source ? source.getAttribute("data-changelog-source") : window.location.pathname;
      var href = path + "#" + encodeURIComponent(identity);
      wrapper.querySelector("a").setAttribute("href", href);
      heading.classList.add("relative", "group", "flex", "items-center");
      if (!heading.querySelector(".changelog-heading-link")) {
        var titleLink = document.createElement("a");
        titleLink.className = "changelog-heading-link";
        titleLink.setAttribute("href", href);
        Array.from(heading.childNodes).forEach(function (node) {
          if (node !== wrapper) titleLink.appendChild(node);
        });
        heading.appendChild(titleLink);
      }
      heading.querySelector(".changelog-heading-link").setAttribute("href", href);
    });
  }

  function pageMonth(root) {
    var headings = root.querySelectorAll('[data-component-part="update-content"] [id]');
    for (var index = 0; index < headings.length; index += 1) {
      var match = headings[index].id.match(/(\d{4}-\d{2})-\d{2}/);
      if (match) return match[1];
    }
    return null;
  }

  async function readMonthPage(path) {
    var response = await fetch(path, { credentials: "same-origin" });
    if (!response.ok) throw new Error("Unable to load archive");
    var page = new DOMParser().parseFromString(await response.text(), "text/html");
    if (!page.querySelector("#content .update-container")) throw new Error("Empty archive");
    return page;
  }

  function setupMonthReader() {
    if (!document.getElementById("changelog-labels")) return;
    var content = document.getElementById("content");
    if (monthReader && monthReader.content === content && monthReader.path === window.location.pathname) {
      repairMonthLayout(monthReader);
      return;
    }
    if (monthReader && monthReader.observer) monthReader.observer.disconnect();
    if (monthReader && monthReader.details) monthReader.details.remove();
    var oldVisibility = document.getElementById("changelog-month-visibility");
    if (oldVisibility) oldVisibility.remove();
    var locale = window.location.pathname.split("/")[1];
    var currentPath = "/" + locale + "/changelog";
    var archive = window.location.pathname.match(/changelog-(\d{4}-\d{2})$/);
    if (!archive && window.location.pathname !== currentPath) return;
    var initialMonth = archive ? archive[1] : pageMonth(content);
    if (!initialMonth) return;
    var state = { content: content, path: window.location.pathname, locale: locale, months: [], loaded: new Map(), pending: new Map(), links: new Map(), initial: initialMonth };
    monthReader = state;
    var initialize = async function () {
      var catalog = archive ? await readMonthPage(currentPath) : document;
      if (monthReader !== state || !content.isConnected) return;
      var latestMonth = pageMonth(catalog);
      if (!latestMonth) return;
      state.months = [{ month: latestMonth, path: currentPath }];
      catalog.querySelectorAll('[data-changelog-month]').forEach(function (item) {
        var month = item.getAttribute("data-changelog-month");
        state.months.push({ month: month, path: currentPath + "-" + month });
      });
      state.months.sort(function (a, b) { return b.month.localeCompare(a.month); });
      var updates = content.querySelectorAll(":scope > .update-container");
      updates.forEach(function (update) {
        update.style.order = -Number(initialMonth.replace("-", ""));
        update.setAttribute("data-changelog-source", state.path);
      });
      setupHeadingLinks();
      state.loaded.set(initialMonth, { first: updates[0], last: updates[updates.length - 1] });
      // Keep server-rendered archive links as the no-JavaScript fallback.
      var footer = updates[updates.length - 1].nextElementSibling;
      while (footer) {
        footer.setAttribute("data-changelog-footer", "true");
        footer = footer.nextElementSibling;
      }
      content.setAttribute("data-continuous-changelog", "true");
      var stream = document.createElement("div");
      stream.id = "changelog-month-stream";
      content.appendChild(stream);
      state.stream = stream;
      var sentinel = document.createElement("a");
      sentinel.className = "changelog-next-month";
      stream.appendChild(sentinel);
      state.sentinel = sentinel;
      state.observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) loadNextMonth(state);
      }, { rootMargin: "600px 0px" });
      setupMonthSidebar(state);
      repairMonthLayout(state);
      updateNextMonth(state);
      updateReadingMonth();
    };
    initialize().catch(function () { if (monthReader === state) monthReader = null; });
  }

  function repairMonthLayout(state) {
    if (!state.stream) return;
    state.content.setAttribute("data-continuous-changelog", "true");
    // Mintlify hydration may move unmanaged nodes ahead of its own children.
    if (state.content.lastElementChild !== state.stream) state.content.appendChild(state.stream);
    var updates = state.content.querySelectorAll(":scope > .update-container");
    var footer = updates.length && updates[updates.length - 1].nextElementSibling;
    while (footer && footer !== state.stream) {
      footer.setAttribute("data-changelog-footer", "true");
      footer = footer.nextElementSibling;
    }
    setupMonthSidebar(state);
    if (state.readingStart) showReadingRange(state);
    document.querySelectorAll('#table-of-contents a[href^="#"]').forEach(function (link) {
      var target;
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); } catch (_) { return; }
      if (target && target.hasAttribute("data-changelog-footer")) link.parentElement.hidden = true;
    });
  }

  function monthName(state, month) {
    return new Intl.DateTimeFormat(state.locale, { month: "long", timeZone: "UTC" }).format(new Date(month + "-01T00:00:00Z"));
  }

  function setupMonthSidebar(state) {
    var nav = document.getElementById("navigation-items");
    if (!nav) return;
    var currentPath = "/" + state.locale + "/changelog";
    var yearLink = nav.querySelector('a[href="' + currentPath + '"]');
    if (!yearLink) return;
    var item = yearLink.closest("li");
    if (item.querySelector(".changelog-year")) return;
    item.setAttribute("data-changelog-year", "true");
    var details = document.createElement("details");
    details.className = "changelog-year";
    details.open = true;
    var summary = document.createElement("summary");
    summary.textContent = yearLink.textContent;
    var chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("viewBox", "0 0 24 24");
    chevron.setAttribute("aria-hidden", "true");
    var chevronPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    chevronPath.setAttribute("d", "m9 5 7 7-7 7");
    chevron.appendChild(chevronPath);
    summary.appendChild(chevron);
    details.appendChild(summary);
    var list = document.createElement("ul");
    details.appendChild(list);
    state.months.filter(function (entry) { return entry.month.slice(0, 4) === state.initial.slice(0, 4); }).forEach(function (entry) {
      var row = document.createElement("li");
      var link = document.createElement("a");
      link.href = entry.path;
      link.textContent = monthName(state, entry.month);
      link.addEventListener("click", async function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        var requestId = (state.navigationRequest || 0) + 1;
        state.navigationRequest = requestId;
        link.setAttribute("aria-busy", "true");
        try {
          await loadMonth(state, entry);
          if (monthReader !== state || state.navigationRequest !== requestId) return;
          state.readingStart = entry.month;
          showReadingRange(state);
          state.loaded.get(entry.month).first.scrollIntoView({ block: "start", behavior: "instant" });
          state.active = null;
          updateReadingMonth();
          updateNextMonth(state);
        } catch (_) {
          window.location.assign(entry.path);
        } finally {
          link.removeAttribute("aria-busy");
        }
      });
      row.appendChild(link);
      list.appendChild(row);
      state.links.set(entry.month, link);
    });
    item.appendChild(details);
    state.details = details;
  }

  function nextMonth(state) {
    var oldest = state.visibleMonths ? Array.from(state.visibleMonths).sort()[0] : Array.from(state.loaded.keys()).sort()[0];
    return state.months.find(function (entry) { return entry.month < oldest; });
  }

  function showReadingRange(state) {
    var start = state.readingStart || state.initial;
    var visible = new Set();
    var entries = state.months.filter(function (entry) { return entry.month <= start; });
    for (var index = 0; index < entries.length; index += 1) {
      if (!state.loaded.has(entries[index].month)) break;
      visible.add(entries[index].month);
    }
    state.visibleMonths = visible;
    var visibilityStyle = document.getElementById("changelog-month-visibility");
    if (!visibilityStyle) {
      visibilityStyle = document.createElement("style");
      visibilityStyle.id = "changelog-month-visibility";
      document.head.appendChild(visibilityStyle);
    }
    var rules = visible.has(state.initial) ? "" : '#content[data-continuous-changelog] > .update-container { display:none!important; }';
    state.loaded.forEach(function (_, month) {
      if (!visible.has(month)) rules += '#changelog-month-stream > section[data-reading-month="' + month + '"] { display:none!important; }';
    });
    if (visibilityStyle.textContent !== rules) visibilityStyle.textContent = rules;
    state.loaded.forEach(function (range, month) {
      var node = range.first;
      while (node) {
        node.hidden = !visible.has(month);
        if (node === range.last) break;
        node = node.nextElementSibling;
      }
    });
    document.querySelectorAll('#table-of-contents .toc-item').forEach(function (item) {
      var month = item.getAttribute("data-reading-month") || state.initial;
      item.hidden = !visible.has(month);
    });
  }

  function updateNextMonth(state) {
    state.observer.unobserve(state.sentinel);
    var next = nextMonth(state);
    state.sentinel.hidden = !next;
    if (!next) return;
    state.sentinel.href = next.path;
    state.sentinel.textContent = monthName(state, next.month);
    state.observer.observe(state.sentinel);
  }

  function loadMonth(state, entry) {
    if (state.loaded.has(entry.month)) return Promise.resolve();
    if (state.pending.has(entry.month)) return state.pending.get(entry.month);
    var request = readMonthPage(entry.path).then(function (page) {
      if (monthReader !== state || !state.content.isConnected) return;
      var section = document.createElement("section");
      section.setAttribute("data-reading-month", entry.month);
      section.setAttribute("data-changelog-source", entry.path);
      section.style.order = -Number(entry.month.replace("-", ""));
      section.setAttribute("aria-label", monthName(state, entry.month) + " " + entry.month.slice(0, 4));
      var updates = page.querySelectorAll("#content .update-container");
      updates.forEach(function (update) {
        var clone = document.importNode(update, true);
        clone.querySelectorAll("script").forEach(function (script) { script.remove(); });
        clone.querySelectorAll("video[src]").forEach(function (video) {
          video.setAttribute("data-src", video.getAttribute("src"));
          video.removeAttribute("src");
          video.setAttribute("preload", "none");
          video.classList.add("changelog-lazy-video");
        });
        // Older auto-generated heading aliases can repeat across monthly files.
        clone.querySelectorAll("[id]").forEach(function (node) {
          if (document.getElementById(node.id)) node.removeAttribute("id");
        });
        section.appendChild(clone);
      });
      var following = Array.from(state.stream.querySelectorAll(":scope > section")).find(function (node) {
        return node.getAttribute("data-reading-month") < entry.month;
      });
      state.stream.insertBefore(section, following || state.sentinel);
      state.loaded.set(entry.month, { first: section.firstElementChild, last: section.lastElementChild });
      var toc = document.getElementById("table-of-contents-content");
      if (toc) page.querySelectorAll("#table-of-contents-content .toc-item").forEach(function (item) {
        var link = item.querySelector("a");
        if (!link) return;
        var target;
        try { target = decodeURIComponent(link.getAttribute("href").slice(1)); } catch (_) { return; }
        if (!Array.from(section.querySelectorAll("[id]")).some(function (node) { return node.id === target; })) return;
        var copy = document.importNode(item, true);
        copy.removeAttribute("data-changelog-active");
        copy.setAttribute("data-reading-month", entry.month);
        copy.querySelector("a").removeAttribute("aria-current");
        copy.querySelector("a").setAttribute("href", entry.path + "#" + encodeURIComponent(target));
        var followingItem = Array.from(toc.querySelectorAll("[data-reading-month]")).find(function (node) {
          return node.getAttribute("data-reading-month") < entry.month;
        });
        toc.insertBefore(copy, followingItem || null);
      });
      setupHeadingLinks();
      setupLazyVideos();
      showReadingRange(state);
      updateNextMonth(state);
    }).finally(function () { state.pending.delete(entry.month); });
    state.pending.set(entry.month, request);
    return request;
  }

  function loadNextMonth(state) {
    var next = nextMonth(state);
    if (!next) return;
    state.observer.unobserve(state.sentinel);
    loadMonth(state, next).then(function () {
      showReadingRange(state);
      updateNextMonth(state);
    }).catch(function () {
      // The visible native link remains usable if fetching fails.
      state.sentinel.removeAttribute("aria-busy");
    });
  }

  function updateReadingMonth() {
    var state = monthReader;
    if (!state || !state.loaded.size) return;
    var active = state.readingStart || state.initial;
    Array.from(state.loaded.keys()).sort().reverse().forEach(function (month) {
      if (state.visibleMonths && !state.visibleMonths.has(month)) return;
      var range = state.loaded.get(month);
      if (range.first.getBoundingClientRect().top <= 200) active = month;
    });
    if (state.active === active) return;
    state.active = active;
    state.links.forEach(function (link, month) {
      if (month === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    var visible = state.links.get(active);
    var sidebar = document.getElementById("sidebar-content");
    if (visible && sidebar) {
      var bounds = visible.getBoundingClientRect();
      var container = sidebar.getBoundingClientRect();
      if (bounds.bottom > container.bottom) sidebar.scrollTop += bounds.bottom - container.bottom;
      if (bounds.top < container.top) sidebar.scrollTop -= container.top - bounds.top;
    }
  }

  function collectPairs() {
    syncCurrentPath();

    if (!isChangelogPage()) {
      if (monthReader && monthReader.observer) monthReader.observer.disconnect();
      monthReader = null;
      pairs = [];
      clearActiveState();
      return;
    }

    redirectHistoricalAnchor();
    normalizeNavigationHeadings();
    setupLazyVideos();
    setupHeadingLinks();
    setupMonthReader();

    var tocItems = Array.prototype.slice.call(document.querySelectorAll("#table-of-contents .toc-item"));
    var tocByHash = new Map();

    tocItems.forEach(function (item) {
      var link = item.querySelector("a[href*='#']");
      if (link) {
        var hash = link.getAttribute("href").split("#")[1];
        try { hash = decodeURIComponent(hash); } catch (_) {}
        tocByHash.set("#" + hash, { item: item, link: link });
      }
    });

    pairs = Array.prototype.slice.call(document.querySelectorAll(".update-container[id]"))
      .map(function (update) {
        if (update.hidden) return null;
        var toc = tocByHash.get("#" + update.id);
        return toc ? { update: update, item: toc.item, link: toc.link } : null;
      })
      .filter(Boolean);

    updateActiveState(true);
  }

  function hydrateLazyVideo(video) {
    var src = video.getAttribute("data-src");

    if (!src) {
      return;
    }

    video.setAttribute("src", src);
    video.removeAttribute("data-src");
    video.setAttribute("data-changelog-lazy-loaded", "true");
    video.load();

    if (video.hasAttribute("autoplay")) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }
  }

  function setupLazyVideos() {
    var lazyVideos = Array.prototype.slice.call(
      document.querySelectorAll("video.changelog-lazy-video[data-src]:not([data-changelog-lazy-bound])")
    );

    if (!lazyVideos.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      lazyVideos.forEach(hydrateLazyVideo);
      return;
    }

    if (!lazyVideoObserver) {
      lazyVideoObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }

            hydrateLazyVideo(entry.target);
            lazyVideoObserver.unobserve(entry.target);
          });
        },
        {
          rootMargin: "800px 0px",
          threshold: 0.01,
        }
      );
    }

    lazyVideos.forEach(function (video) {
      video.setAttribute("data-changelog-lazy-bound", "true");
      lazyVideoObserver.observe(video);
    });
  }

  function scheduleCollectPairs() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(collectPairs, 100);
  }

  function updateActiveState(force) {
    if (!pairs.length) {
      return;
    }

    var anchorY = Math.min(window.innerHeight * 0.35, 260);
    var activePair = pairs[0];

    pairs.forEach(function (pair) {
      if (pair.update.getBoundingClientRect().top <= anchorY) {
        activePair = pair;
      }
    });

    if (!force && activePair.update.id === activeId) {
      return;
    }

    pairs.forEach(function (pair) {
      pair.item.removeAttribute("data-changelog-active");
      pair.link.removeAttribute("aria-current");
    });

    activePair.item.setAttribute("data-changelog-active", "true");
    activePair.link.setAttribute("aria-current", "location");
    keepActiveItemVisible(activePair.item);
    activeId = activePair.update.id;
  }

  function keepActiveItemVisible(item) {
    var scroller = document.querySelector("#table-of-contents");
    if (!scroller) {
      return;
    }

    var itemRect = item.getBoundingClientRect();
    var scrollerRect = scroller.getBoundingClientRect();
    var padding = 8;

    if (itemRect.top < scrollerRect.top) {
      scroller.scrollTop -= scrollerRect.top - itemRect.top + padding;
    } else if (itemRect.bottom > scrollerRect.bottom) {
      scroller.scrollTop += itemRect.bottom - scrollerRect.bottom + padding;
    }
  }

  function scheduleActiveStateUpdate() {
    if (scrollScheduled) {
      return;
    }

    scrollScheduled = true;
    window.requestAnimationFrame(function () {
      scrollScheduled = false;
      updateReadingMonth();
      updateActiveState(false);
    });
  }

  window.addEventListener("scroll", scheduleActiveStateUpdate, { passive: true });
  window.addEventListener("resize", scheduleCollectPairs);
  window.addEventListener("hashchange", scheduleCollectPairs);
  window.addEventListener("DOMContentLoaded", collectPairs);

  new MutationObserver(scheduleCollectPairs).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  collectPairs();
})();
