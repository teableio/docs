(function () {
  var pairs = [];
  var activeId = null;
  var scrollScheduled = false;
  var refreshTimer = null;

  function isChangelogPage() {
    var currentPath = document.documentElement.getAttribute("data-current-path") || window.location.pathname;
    return /\/changelog\/?$/.test(currentPath);
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

  function collectPairs() {
    if (!isChangelogPage()) {
      pairs = [];
      clearActiveState();
      return;
    }

    var tocItems = Array.prototype.slice.call(document.querySelectorAll("#table-of-contents .toc-item"));
    var tocByHash = new Map();

    tocItems.forEach(function (item) {
      var link = item.querySelector("a[href^='#']");
      if (link) {
        tocByHash.set(link.getAttribute("href"), { item: item, link: link });
      }
    });

    pairs = Array.prototype.slice.call(document.querySelectorAll(".update-container[id]"))
      .map(function (update) {
        var toc = tocByHash.get("#" + update.id);
        return toc ? { update: update, item: toc.item, link: toc.link } : null;
      })
      .filter(Boolean);

    updateActiveState(true);
  }

  function scheduleCollectPairs() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(collectPairs, 100);
  }

  function updateActiveState(force) {
    if (!pairs.length) {
      return;
    }

    var anchorY = window.scrollY + Math.min(window.innerHeight * 0.35, 260);
    var activePair = pairs[0];

    pairs.forEach(function (pair) {
      if (pair.update.offsetTop <= anchorY) {
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
