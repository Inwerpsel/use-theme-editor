javascript: void (() => {
  try {
    
    [...document.querySelectorAll('script,iframe, link[rel=preload]')].forEach((e) =>
      e.parentNode.removeChild(e)
    );
    const titleEl = document.createElement('title');
    titleEl.innerHTML = document.title;
    document.head.append(titleEl);
    document.title = 'index';
  } catch (e) {
    alert(e);
  }
})();
