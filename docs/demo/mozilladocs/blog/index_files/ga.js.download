// Mozilla DNT Helper
/* This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/. */
if (typeof Mozilla === "undefined") {
  var Mozilla = {};
}
Mozilla.dntEnabled = function (dnt, ua) {
  "use strict";
  var dntStatus =
    dnt || navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  var userAgent = ua || navigator.userAgent;
  var anomalousWinVersions = [
    "Windows NT 6.1",
    "Windows NT 6.2",
    "Windows NT 6.3",
  ];
  var fxMatch = userAgent.match(/Firefox\/(\d+)/);
  var ieRegEx = /MSIE|Trident/i;
  var isIE = ieRegEx.test(userAgent);
  var platform = userAgent.match(/Windows.+?(?=;)/g);
  if (isIE && typeof Array.prototype.indexOf !== "function") {
    return false;
  } else if (fxMatch && parseInt(fxMatch[1], 10) < 32) {
    dntStatus = "Unspecified";
  } else if (
    isIE &&
    platform &&
    anomalousWinVersions.indexOf(platform.toString()) !== -1
  ) {
    dntStatus = "Unspecified";
  } else {
    dntStatus = { 0: "Disabled", 1: "Enabled" }[dntStatus] || "Unspecified";
  }
  return dntStatus === "Enabled" ? true : false;
};
// only load GA if DNT is not enabled
if (Mozilla && !Mozilla.dntEnabled()) {
    window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
    ga('create', 'UA-36116321-5', 'mozilla.org');
    ga('set', 'anonymizeIp', true);
    ga('send', 'pageview');

    var gaScript = document.createElement('script');
    gaScript.async = 1; gaScript.src = 'https://www.google-analytics.com/analytics.js';
    document.head.appendChild(gaScript);
}
