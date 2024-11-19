import { Fragment, useContext, useMemo } from "react";
import { HistoryNavigateContext, clearAlternate, replayAlternate } from "../../hooks/useResumableReducer";
import { Tutorial } from "../../_unstable/Tutorial";

export function HistoryStash() {
    const { lastAlternate, historyOffset, past, lastAlternateIndex } =
      useContext(HistoryNavigateContext);

    const position = past.length - historyOffset - lastAlternateIndex;

    const empty = lastAlternate.length === 0;
    const content = empty 
    ? <Fragment>Stash</Fragment> 
    : <Fragment>{lastAlternate.length} steps stashed <br/>{position} steps since</Fragment>;

    const stringied = useMemo(() => JSON.stringify(lastAlternate.map(a=>[...a.entries()].map(([k]) => k)), null, 2), [lastAlternate])

    return (
      <Fragment>
        <div
          className="flex-row"
          style={{
            background: `rgba(26, 217, 210, ${Math.min(
              lastAlternate.length / 20,
              1
            )})`,
          }}
        >
          <button
            title={'Apply/create stash:\n' + stringied}
            onClick={replayAlternate}
            style={{ textAlign: 'left' }}
            disabled={empty && historyOffset === 0}
          >
            {content}
          </button>
          {!empty && <Clear />}
        </div>
        <Tutorial
          el={HistoryStash}
          tasks={[
            () => {
              const { pins } = useContext(HistoryNavigateContext);
              return [
                'Remove all pins',
                pins.size === 0,
              ];
            },
            () => {
              const { historyOffset } = useContext(HistoryNavigateContext);
              return [
                'Navigate back',
                historyOffset !== 0 || !empty,
              ];
            },
            () => ['Add future actions to the stash', !empty]
          ]}
        >
          If you travel back and discard future, it's still kept here. This
          allows you to splice in a new edit earlier into your history and just
          re-apply everything after it.
        </Tutorial>
      </Fragment>
    );
}

function Clear() {
  return <button onClick={clearAlternate}>Clear</button>
}

// settings:
// - Min stash size
// - Stash warn on delete size
// - boolean behavior after applying stash (stay before or go after?)

// todo:
// - pins
// - initial history entry should contain all state values, so it can be pinned there
//   - this in turn allows for a way to deal with pins when they're on the thing that's about to be stashed
//   - either the pin is removed and the old value is used again (probably unwanted a lot of the time but it's an easy option)
//   - or the pin history can be removed, in which case the pinned value has to move all the way to the initial state

HistoryStash.fName = 'HistoryStash';