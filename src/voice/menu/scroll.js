function scrollable() {
  return document.getElementById('area-left');
}

let delta = 300;

export const scroll = {
  up(n = 2) {
    console.log(`up, n is "${n}"`);
    Math.max(
      0,
      scrollable().scrollTo({
        left: 0,
        top: scrollable().scrollTop - delta * n - 1,
        behavior: 'smooth',
      })
    );
  },
  down(n = 2) {
    console.log(`down, n is "${n}"`);
    scrollable().scrollTo({
      left: 0,
      top: scrollable().scrollTop + delta * n - 1,
      behavior: 'smooth',
    });
  },
  top() {
    scrollable().scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  },
  bottom() {
    scrollable().scrollTo({
      left: 0,
      top: scrollable().scrollHeight,
      behavior: 'smooth',
    });
  },
  half() {
    scrollable().scrollTo({
      left: 0,
      top: scrollable().scrollHeight / 2 - delta,
      behavior: 'smooth',
    });
  },
  quarter(n) {
    scrollable().scrollTo({
      left: 0,
      top: (scrollable().scrollHeight / 4) * (n === '3' ? 3 : 1) - delta,
      behavior: 'smooth',
    });
  },
};