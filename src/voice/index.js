import { useSyncExternalStore } from 'react';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let isSleeping = false;
const contexts = [];

const notifiers = new Set();

function subUnsub(s) {
  notifiers.add(s);

  return () => {
    notifiers.delete(s);
  };
}
function notify() {
  for (const n of notifiers.values()) {
    n();
  }
}

export const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

export function startRecognition() {
  recognition.start();
}
export function stopRecognition() {
  recognition.stop();
}

let lastText = '';

let delta = 300;

function home() {
  currentMenu = menu;
}

function scrollable() {
  return document.getElementById('area-left');
}

const menu = {
  scroll: {
    up(n = 1) {
      console.log(`up, n is "${n}"`);
      Math.max(
        0,
        scrollable().scrollTo({
          left: 0,
          top: scrollable().scrollTop - delta * n,
          behavior: 'smooth',
        })
      );
    },
    down(n = 1) {
      console.log(`down, n is "${n}"`);
      scrollable().scrollTo({
        left: 0,
        top: scrollable().scrollTop + delta * n,
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
        top: scrollable().scrollHeight / 2,
        behavior: 'smooth',
      });
    },
    home,
    // previous: () => {},
    // next: () => {},
  },
  find: {
    home,
  },
};
let currentMenu = menu;

recognition.onresult = function (event) {
  const result = event.results[event.resultIndex || 0][0];
  const text = result.transcript;
  if (text === '') {
    return;
  }
  if (isSleeping) {
    isSleeping = text !== 'wake';
    return;
  }
  if (text === 'sleep') {
    isSleeping = true;
    return;
  }
  lastText = text;

  const words = text.split(' ');

  let command,
    args = [];

  words.forEach((part) => {
    const word = part.toLowerCase();
    if (!currentMenu.hasOwnProperty(word)) {
      if (command) {
        args.push(word);
      }
      return;
    }
    const next = currentMenu[word];

    if (typeof next === 'object') {
      if (command) {
        command(...args);
        command = null;
        args = [];
      }
      currentMenu = next;
      return;
    }
    command = next;
  });

  if (command) {
    command(...args);
  }

  notify();
};

recognition.onerror = function (event) {
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
};

export const hooks = {
  lastText: () => useSyncExternalStore(subUnsub, () => lastText),

  currentMenu: () => useSyncExternalStore(subUnsub, () => currentMenu),
};
