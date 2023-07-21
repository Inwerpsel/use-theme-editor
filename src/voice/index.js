import { useSyncExternalStore } from 'react';
import { homeMenu } from './menu';

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
    // Getting around it properly involves complex and slow consideration of multiple detected alternatives.
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
    // In Chrome, it never seems to return numbers much higher than 5 as text.
    // Hence I commented these again with some margin.
    //
    // Unfortunately it's still possible for any number to be textual,
    // as the speech recognition is very context sensitive.
    // It's handled by AI trained on real world transcriptions.
    // If the surrounding words line it up the right way, it would still return it as text.
    // For example, if it's very similar to a title (e.g. movie/book) that is/contains a number in
    // textual representation, it would be inclined to transcribe it this way too.
    // In the same way, some words are capitalized if they're also the name of something.
    // 
    // While this behavior can be annoying, it can also be leveraged. You can prefix your command with
    // something that is likely to avoid a common miscapture.
    // E.g. if it captures "it's" instead of "is", and the command starts with "is",
    // you could say "the thing is".
    // In the current implementation, "the thing" will just be ignored unless there's
    // a command with that name.
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
    // Unless you really tweak your pronunciation, it always miscaptures in the following way.
    // For "true", it miscaptures even more, pretty much always it's "through".
    // However that's not a problem as it's still truthy.
    case 'falls':
      return 'false';
  }
  return word;
}

let currentMenu = homeMenu;

function home() {
  currentMenu = homeMenu;
}

let lastText = '';
let dedupeText = '';
let timeout;

const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.lang = 'en-US';
// Keep it simple for now, it's hard with the current logic to know what to do when
// multiple variants result in a command. This likely also slows things down even if increased by 1.
// It can be quite a lot more data that needs to go over the network, and a more complex task for the
// server sending that data.
// Perhaps with a few alternatives it can score each based on the number of captured commands and arguments,
// and then pick the highest.
recognition.maxAlternatives = 1;
// Even though getting just 1 final result is a lot easier to work with,
// it just takes too long for it to be usable.
// Since it's debounced, you really need a long pause to get it to run the commands you spoke.
// To make things worse, it's very inconsistent, though for a given short phrase it's usually consistent.
// e.g. the word "nothing" is always processed really fast, almost instantaneously.
// Then, a phrase with a few words would take from around 500ms to a few seconds, depending on how ambiguous it sounds.

// The interimResults return something almost immediately most of the time.
// The tradeoff is it's quite hard to know what to do with corrected phrases.
// Luckily, with the current set of commands, this doesn't lead to ambiguity between multiple commands.
// Most of the time, it would just execute the intended command but with an incomplete argument list.
// e.g. "width 1920" has sufficient pause between "19" and "20" for it to return an intermediary result
// saying "width 19".
// While it's a bit glitchy, it's corrected fast enough as long as the final state is captured correctly.
// To avoid this being recorded in history, it uses a larger squash time for the latest state.
recognition.interimResults = true;

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
  console.log('[RECEIVED]', words);

  let command,
    // Contains all words that are themselves not a command.
    // Used both for arguments and processing of long commands.
    buffer = [];

  words.forEach((rawWord) => {
    let word = fixCommonMiscaptures(rawWord);

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
        console.log('[TRYING]', longCommand)
        if (currentMenu.hasOwnProperty(longCommand)) {
          word = longCommand;
          found = true;
        }
      }
      if (!found) {
        // No long command, just add to buffer.
        buffer.push(
          // Quick and dirty fix to allow controlling boolean state.
          word === 'true' ? true : word === 'false' ? false : word
        );
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
      if (currentMenu !== homeMenu) {
        currentMenu.home = home;
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

let isRunning = false;
export function toggleRecognition() {
  isRunning ? recognition.stop() : recognition.start();
  // We can't rely on onstart and onend also setting isRunning, as they run later
  // but should set it to the same value.
  isRunning = !isRunning;
  notify();
}

// No detailed listening for now.
export const hooks = {
  lastText: () => useSyncExternalStore(subUnsub, () => lastText),
  currentMenu: () => useSyncExternalStore(subUnsub, () => currentMenu),
  isRunning: () => useSyncExternalStore(subUnsub, () => isRunning),
};

recognition.onstart = function() {
  isRunning = true;
}
recognition.onend = function() {
  isRunning = false;
}

// Todo: move somewhere else.
document.addEventListener('keyup',  (e) => {
  if ( e.code == "Space" && document.activeElement.nodeName !== 'INPUT' && document.activeElement.nodeName !== 'BUTTON') {
    toggleRecognition();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
})