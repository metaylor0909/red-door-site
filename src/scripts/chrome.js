// Site-wide header/nav/reveal behavior, ported from index.html's shared
// script block (the header scroll state, mobile menu toggle, dropdown
// toggles, and scroll-reveal observer only — the homepage-only pieces like
// the reviews carousel are not needed on the blog and were left out).
(function () {
  var header = document.querySelector("[data-header]");
  var menuToggle = document.querySelector("[data-menu-toggle]");
  var navMenu = document.querySelector("[data-nav-menu]");
  var mobileSticky = document.querySelector("[data-mobile-sticky]");

  function syncHeader() {
    var isScrolled = window.scrollY > 34;
    header.classList.toggle("is-scrolled", isScrolled);
    if (mobileSticky) {
      var showSticky = window.innerWidth <= 720 && window.scrollY > window.innerHeight * 0.62;
      mobileSticky.classList.toggle("is-visible", showSticky);
      mobileSticky.setAttribute("aria-hidden", String(!showSticky));
    }
  }

  window.addEventListener("scroll", syncHeader, { passive: true });
  window.addEventListener("resize", syncHeader);
  syncHeader();

  if (menuToggle && navMenu) {
    menuToggle.addEventListener("click", function () {
      var isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      navMenu.classList.toggle("is-open", !isOpen);
      header.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });
  }

  document.querySelectorAll("[data-dropdown-toggle]").forEach(function (button) {
    button.addEventListener("click", function () {
      var item = button.closest("[data-nav-item]");
      var isOpen = item.classList.contains("is-open");
      document.querySelectorAll("[data-nav-item]").forEach(function (navItem) {
        navItem.classList.remove("is-open");
        var toggle = navItem.querySelector("[data-dropdown-toggle]");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
      item.classList.toggle("is-open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest("[data-nav-item]")) {
      document.querySelectorAll("[data-nav-item]").forEach(function (item) {
        item.classList.remove("is-open");
        var toggle = item.querySelector("[data-dropdown-toggle]");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
      if (navMenu && navMenu.classList.contains("is-open")) {
        menuToggle.click();
      }
    });
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach(function (item) {
      observer.observe(item);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (item) {
      item.classList.add("is-visible");
    });
  }
})();
