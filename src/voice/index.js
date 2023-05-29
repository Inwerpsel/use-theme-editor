import { useSyncExternalStore } from 'react';
import { menu } from './menu';
import { scroll } from './menu/scroll';

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

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

function fixCommonMiscaptures(word) {
  switch (word) {
    case 'zero':
      return '0';
    case 'one':
      return '1';
    case 'two':
      return '2';
    // This is not a problem, for now.
    case 'to':
      return '2';
    case 'three':
      return '3';
    case 'four':
      return '4';
    case 'five':
      return '5';
    case 'six':
      return '6';
    case 'seven':
      return '7';
    case 'eight':
      return '8';
    // case 'nine':
    //   return '9';
    // case 'ten':
    //   return '10';
    // case 'eleven':
    //   return '11';
    // case 'twelve':
    //   return '12';
    // case 'thirteen':
    //   return '13';
    case 'with':
      return 'width';
    case 'falls': // ugh
      return 'false';
  }
  return word;
}

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

export function startRecognition() {
  recognition.start();
}
export function stopRecognition() {
  recognition.stop();
}

let lastText = '';

function home() {
  currentMenu = menu;
}

let currentMenu = menu;

let dedupeText = '';
let timeout;

recognition.onresult = function (event) {
  const result = event.results[event.resultIndex || 0][0];
  const text = result.transcript.trim().toLowerCase();
  // Often it returns empty strings (probably Chrome bug).
  // While using intermediate results, it often "starts over",
  // and gives the same string twice in a row, or even just a part of the first.
  // We can just ignore any text that adds nothing to the previous result.
  if (text === '' || dedupeText.includes(text)) {
    return;
  }
  timeout && clearTimeout(timeout);

  dedupeText = text;
  // Currently looks redundant as these are the same, but that will likely change.
  lastText = text;
  timeout = setTimeout(() => {
    dedupeText = '';
  }, 1500);

  const words = text.split(' ');
  console.log('RECEIVED', words);

  let command,
    // Contains all words that are themselves not a command.
    // Used both for arguments and processing of long commands.
    buffer = [];

  words.forEach((part) => {
    let word = fixCommonMiscaptures(part);

    if (!currentMenu.hasOwnProperty(word)) {
      // Try if the word forms a long command with previous unknown chunks.
      let longCommand,
        found = false;

      // If word is "baz", and buffer contains ["set", "foo", "bar"],
      // it will try in this order:
      // "set foo bar baz"
      // "foo bar baz"
      // "bar baz"
      for (let i = 0; !found && i < buffer.length ; i++) {
        longCommand = `${buffer.slice(i).join(' ')} ${word}`;
        console.log('trying', longCommand)
        if (currentMenu.hasOwnProperty(longCommand)) {
          word = longCommand;
          found = true;
        }
      }
      if (!found) {
        buffer.push(word === 'true' ? true : word === 'false' ? false : word);
        return;
      }
    }

    const next = currentMenu[word];

    // Entering a new command/menu, so we have acquired all
    // arguments for the previous command and can run it.
    if (command) {
      command(...buffer);
      command = null;
      buffer = [];
    }

    if (typeof next === 'object') {
      // It's a new menu.
      // Create dynamic menu items upon entering.
      if (next._dynamic) {
        const clone = next._dynamic(Object.assign({}, next));
        delete clone._dynamic;
        currentMenu = clone;
      } else {
        currentMenu = next;
      }
      if (currentMenu !== menu) {
        currentMenu.home = home;
        currentMenu.scroll = scroll;
      }
      return;
    }
    // It must be a function (command) then.
    // Delay execution until we have all args.
    command = next;
    buffer = [];
  });

  // Run last encountered command, if any.
  if (command) {
    command(...buffer);
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

// const api = {
//     lastText,
//     currentMenu,
// };

// export const hooks2 = 

let isRunning = false;

export function recognitionIsRunning() {
  return isRunning;
}

recognition.onstart = function() {
  isRunning = true;
}
recognition.onend = function() {
  isRunning = false;
}

document.addEventListener('keyup',  (e) => {
  if ( e.code == "Space" && document.activeElement.nodeName !== 'INPUT' ) {
    isRunning ? stopRecognition() : startRecognition();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
})