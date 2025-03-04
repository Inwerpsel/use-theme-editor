import { Fragment, useContext, useEffect, useState } from "react";
import { getCurrentOffset, goToStart, historyForwardOne, HistoryNavigateContext } from "../../hooks/useResumableReducer";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { Checkbox } from "../controls/Checkbox";
import { get } from "../../state";

function CountTimeInState({ms}) {
  if (ms < 3999) {
    // This timer doesn't make sense for very short amounts.
    return;
  }
  const { historyOffset } = useContext(HistoryNavigateContext);

  const length = Math.round(ms / 1000) - 1;

  return (
    <span
      key={historyOffset}
      style={{ '--countdown-length': length }}
      className="countdown"
    />
  );
}

export function Play() {
  const {playTime }= get;
  const [on, setOn] = useState(false);
  const [loop, setLoop] = useState(false);
  const [_ms, setMs] = useLocalStorage('replayMs', 1000);

  const ms = playTime > 0 ? playTime * 1000 : _ms;

  useEffect(() => {
    if (on) {
        let interval;
        interval = setInterval(() => {
            if (getCurrentOffset() === 0) {
                if (loop) {
                    goToStart();
                } else {
                    setOn(false);
                    clearInterval(interval);
                }
            } else {
                historyForwardOne();
            }
        }, ms);
        return () => {
            clearInterval(interval);
        };
    }
  }, [on, loop, ms]);

  return (
    <Fragment>
      <input style={{minWidth: '7rem', maxWidth: '7rem'}} type="number" value={_ms} onChange={(e) => setMs(e.target.value)} />
      <Checkbox controls={[loop, setLoop]}>loop</Checkbox>
      <button onClick={goToStart}>⏮</button>
      <button
        onClick={() => {
          setOn(!on);
        }}
      >
        {on ? '⏸' : '▶'}
      </button>
      {on && <CountTimeInState {...{ms}}/>}
    </Fragment>
  );
}

Play.fName = 'Play';