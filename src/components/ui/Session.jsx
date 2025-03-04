import { exportHistory, importHistory } from "../../hooks/useResumableReducer";

export function Session() {
    return (
      <div className="flex-row">
        <button onClick={exportHistory}>Save Timeline</button>
        <label
          style={{
            background: 'rgba(255,255,255,.3)',
            cursor: 'copy',
          }}
        >
          <input
            style={{
                maxWidth: '7rem',
                cursor: 'copy', 
            }}
            type="file"
            accept={'.json'}
            onChange={(event) => {
              const reader = new FileReader();
              // const name = event.target.files[0]?.name;

              reader.onload = (event) => {
                try {
                  const data = JSON.parse(event.target.result);
                  importHistory(data);
                } catch (e) {
                  console.log('failed uploading', e);
                }
              };
              reader.readAsText(event.target.files[0]);
            }}
          />
        </label>
      </div>
    );
}

Session.fName = 'Session';