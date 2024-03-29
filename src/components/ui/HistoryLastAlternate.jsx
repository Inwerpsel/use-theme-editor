import { Fragment, useContext, useMemo } from "react";
import { HistoryNavigateContext, clearAlternate, replayAlternate } from "../../hooks/useResumableReducer";

export function HistoryLastAlternate() {
    const { lastAlternate, historyOffset, past, lastAlternateIndex } =
      useContext(HistoryNavigateContext);

    // if (!lastAlternate) return null;

    const position = past.length - historyOffset - lastAlternateIndex;

    if (lastAlternate.length === 0) {
      return null;
    }

    const content = lastAlternate.length === 0 
    ? <Fragment>Stash</Fragment> 
    : <Fragment>{lastAlternate.length} steps stashed <br/>{position} steps since</Fragment>;

    const stringied = useMemo(() => JSON.stringify(lastAlternate.map(a=>[...a.entries()]), null, 2), [lastAlternate])

    return <div
      className="flex-column" 
      style={{
        background: `rgba(26, 217, 210, ${Math.min(lastAlternate.length / 20, 1)})`,
      }}
      >
        <button
          title={'Apply/create stash:\n' + stringied}
          onClick={replayAlternate}
          style={{textAlign: 'left'}}
        >
          {content}
        </button>
        {lastAlternate.length > 0 && <Clear />}
    </div>
}

function Clear() {
  return <button onClick={clearAlternate}>Clear</button>
}

// settings:
// - Min stash size
// - Stash warn on delete size
// - boolean behavior after applying stash (stay before or go after?)

// todo:
// - locks
// - initial history entry should contain all state values, so it can be locked there
//   - this in turn allows for a way to deal with locks when they're on the thing that's about to be stashed
//   - either the lock is removed and the old value is used again (probably unwanted a lot of the time but it's an easy option)
//   - or the lock history can be removed, in which case the locked value has to move all the way to the initial state