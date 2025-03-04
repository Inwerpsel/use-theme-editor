import { use } from "../../state"

export function PlayTime() {
    const [playTime, setPlayTime] = use.playTime();

    if (playTime === 0) {
        return <button title="No custom playtime" onClick={e=>setPlayTime(4)} >
            🕑
        </button>
    }

    return (
      <div>
        <input
          min={1}
          type="number"
          value={playTime}
          onChange={(e) => setPlayTime(e.target.value, {appendOnly: true, skipHistory: true})}
        />
        🕑
      </div>
    );
}

PlayTime.fName = 'PlayTime';