(function () {
  var pairs = [];
  var activeId = null;
  var scrollScheduled = false;
  var refreshTimer = null;
  var lazyVideoObserver = null;
  var datePicker = null;
  var datePickerIds = "";
  // Mintlify only shows the table of contents (the date list) at xl; keep in sync with style.css.
  var tocHiddenQuery = window.matchMedia("(width < 1280px)");

  function isChangelogPage() {
    var currentPath = document.documentElement.getAttribute("data-current-path") || window.location.pathname;
    return /\/changelog\/?$/.test(currentPath);
  }

  function syncCurrentPath() {
    if (isChangelogPage() && !document.documentElement.getAttribute("data-current-path")) {
      document.documentElement.setAttribute("data-current-path", window.location.pathname);
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

  function collectPairs() {
    syncCurrentPath();
    syncDatePicker();

    if (!isChangelogPage()) {
      pairs = [];
      clearActiveState();
      return;
    }

    setupLazyVideos();

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

  function updateLabelText(update) {
    var label = update.querySelector("[data-component-part='update-label']");
    return label ? label.textContent.trim() : update.id;
  }

  // Below xl there is no table of contents, so a floating native <select> lets readers jump between dates.
  function syncDatePicker() {
    var updates = Array.prototype.slice.call(document.querySelectorAll(".update-container[id]"));

    if (updates.length < 2) {
      removeDatePicker();
      return;
    }

    if (!datePicker || !datePicker.isConnected) {
      datePicker = createDatePicker();
      datePickerIds = "";
    }

    var ids = updates.map(function (update) {
      return update.id;
    }).join(",");

    if (ids !== datePickerIds) {
      var select = datePicker.querySelector("select");
      select.textContent = "";
      updates.forEach(function (update) {
        var option = document.createElement("option");
        option.value = update.id;
        option.textContent = updateLabelText(update);
        select.appendChild(option);
      });
      datePickerIds = ids;
    }

    updateDatePickerValue();
  }

  function createDatePicker() {
    var picker = document.createElement("div");
    picker.id = "changelog-date-picker";
    picker.innerHTML =
      '<span class="changelog-date-picker-value"></span>' +
      '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>' +
      "<select></select>";

    var select = picker.querySelector("select");
    select.setAttribute("aria-label", /^\/zh(\/|$)/.test(window.location.pathname) ? "跳转到日期" : "Jump to date");
    select.addEventListener("change", function () {
      var target = document.getElementById(select.value);
      if (!target) {
        return;
      }

      target.scrollIntoView({ block: "start" });
      window.history.replaceState(window.history.state, "", "#" + target.id);
      updateDatePickerValue();
    });

    document.body.appendChild(picker);
    return picker;
  }

  function removeDatePicker() {
    if (datePicker) {
      datePicker.remove();
      datePicker = null;
      datePickerIds = "";
    }
  }

  function updateDatePickerValue() {
    if (!datePicker || !tocHiddenQuery.matches) {
      return;
    }

    var updates = document.querySelectorAll(".update-container[id]");
    var anchor = Math.min(window.innerHeight * 0.35, 260);
    var active = updates[0];

    for (var index = 1; index < updates.length; index += 1) {
      if (updates[index].getBoundingClientRect().top > anchor) {
        break;
      }
      active = updates[index];
    }

    if (!active) {
      return;
    }

    var select = datePicker.querySelector("select");
    var value = datePicker.querySelector(".changelog-date-picker-value");
    var text = updateLabelText(active);

    if (select.value !== active.id) {
      select.value = active.id;
    }
    if (value.textContent !== text) {
      value.textContent = text;
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
      updateDatePickerValue();
    });
  }

  window.addEventListener("scroll", scheduleActiveStateUpdate, { passive: true });
  window.addEventListener("resize", scheduleCollectPairs);
  window.addEventListener("hashchange", scheduleCollectPairs);
  window.addEventListener("DOMContentLoaded", collectPairs);

  // Ignore the date picker's own updates so refreshing it does not schedule another refresh.
  new MutationObserver(function (records) {
    var external = records.some(function (record) {
      return !datePicker || !datePicker.contains(record.target);
    });

    if (external) {
      scheduleCollectPairs();
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  collectPairs();
})();
