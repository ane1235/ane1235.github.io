(function () {
  'use strict';

  var preferenceKey = 'bronchoscope_261001:view';
  var reports = {
    basic: 'bronchoscope_research_2026-10-01',
    interactive: 'bronchoscope_interactive_261001'
  };
  var entry = new URL(window.location.href);
  var directory = entry.pathname.slice(0, entry.pathname.lastIndexOf('/') + 1);
  var renderedMode = document.documentElement.getAttribute('data-report-view') || 'desktop';

  function isMode(value) {
    return value === 'mobile' || value === 'desktop';
  }

  function savePreference(value) {
    try {
      if (value === 'auto') window.localStorage.removeItem(preferenceKey);
      else window.localStorage.setItem(preferenceKey, value);
    } catch (error) {
      // Private browsing and storage policies still allow URL-based selection.
    }
  }

  function readPreference() {
    try {
      return window.localStorage.getItem(preferenceKey);
    } catch (error) {
      return null;
    }
  }

  function detectMode() {
    var nav = window.navigator;
    var ua = nav.userAgent || '';
    var touchMac = ((nav.platform || '') === 'MacIntel' || /Macintosh/i.test(ua)) && nav.maxTouchPoints > 1;
    return (nav.userAgentData && nav.userAgentData.mobile) || /Android|iPhone|iPad|iPod/i.test(ua) || touchMac ? 'mobile' : 'desktop';
  }

  function reportKind(url) {
    if (url.origin !== entry.origin || url.pathname.slice(0, url.pathname.lastIndexOf('/') + 1) !== directory) return null;
    var name = url.pathname.slice(url.pathname.lastIndexOf('/') + 1);
    for (var kind in reports) {
      if (name === reports[kind] + '.html' || name === reports[kind] + '_mobile.html') return kind;
    }
    return null;
  }

  function setEdition(url, kind, mode) {
    url.pathname = directory + reports[kind] + (mode === 'mobile' ? '_mobile' : '') + '.html';
    return url;
  }

  var requested = entry.searchParams.get('view');
  var preference = null;
  if (isMode(requested) || requested === 'auto') {
    savePreference(requested);
    preference = requested;
  } else {
    var saved = readPreference();
    if (isMode(saved)) preference = saved;
  }
  var selectedMode = isMode(preference) ? preference : detectMode();

  function basicPath() {
    var url = setEdition(new URL(window.location.href), 'basic', selectedMode);
    url.hash = '';
    if (preference) url.searchParams.set('view', preference);
    else url.searchParams.delete('view');
    return url.pathname.slice(url.pathname.lastIndexOf('/') + 1) + url.search;
  }

  window.ReportView = {
    mode: selectedMode,
    preference: preference || 'auto',
    basicPath: basicPath(),
    getBasicPath: basicPath,
    refreshLinks: function () { updateLinks(document); }
  };

  var kind = reportKind(entry);
  if (kind && renderedMode !== selectedMode) {
    var destination = setEdition(new URL(entry.href), kind, selectedMode);
    if (preference) destination.searchParams.set('view', preference);
    window.location.replace(destination.href);
    return;
  }

  function switchURL(value) {
    // Read location at click time: the interactive report changes its hash.
    var url = new URL(window.location.href);
    var currentKind = reportKind(url);
    if (!currentKind) return null;
    setEdition(url, currentKind, value === 'auto' ? detectMode() : value);
    url.searchParams.set('view', value);
    return url;
  }

  function updateLink(link) {
    var value = link.getAttribute('data-view');
    if (isMode(value) || value === 'auto') {
      var switched = switchURL(value);
      if (switched && link.getAttribute('href') !== switched.href) link.setAttribute('href', switched.href);
      if (value === (preference || 'auto')) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
      return;
    }
    var raw = link.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    var url;
    try { url = new URL(raw, window.location.href); } catch (error) { return; }
    var targetKind = reportKind(url);
    if (!targetKind) return;
    // Static mobile hrefs are also no-JavaScript fallbacks, not user overrides.
    setEdition(url, targetKind, selectedMode);
    if (preference) url.searchParams.set('view', preference);
    else url.searchParams.delete('view');
    if (link.getAttribute('href') !== url.href) link.setAttribute('href', url.href);
  }

  function updateLinks(root) {
    if (root.matches && root.matches('a[href]')) updateLink(root);
    if (root.querySelectorAll) {
      Array.prototype.forEach.call(root.querySelectorAll('a[href]'), updateLink);
    }
  }

  function wireLinks() {
    updateLinks(document);
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      updateLink(link);
      var value = link.getAttribute('data-view');
      if ((!isMode(value) && value !== 'auto') || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
      var url = switchURL(value);
      if (!url) return;
      event.preventDefault();
      savePreference(value);
      window.location.assign(url.href);
    });
    window.addEventListener('hashchange', function () { updateLinks(document); });
    if (window.MutationObserver) {
      new window.MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.type === 'attributes') updateLink(record.target);
          else Array.prototype.forEach.call(record.addedNodes, updateLinks);
        });
      }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireLinks, { once: true });
  else wireLinks();
}());
