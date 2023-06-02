import { hooks, toggleRecognition } from '../../voice';

export function VoiceCommands() {
    const lastText = hooks.lastText();
    const menu = hooks.currentMenu();
    const isRunning = hooks.isRunning();
    const commands = Object.keys(menu);

    return (
      <div
        style={isRunning ? {} : { cursor: 'pointer' }}
        onClick={toggleRecognition}
      >
        {isRunning ? (
          <span
            style={{
              float: 'right',
              border: '2px solid lightblue',
              borderRadius: '4px',
            }}
          >
            Listening
          </span>
        ) : (
          <span style={{ float: 'right' }}>click to start</span>
        )}

        <b>Last text:</b>
        <span>{lastText}</span>
        <br />
        <br />
        <ul style={{ listStyleType: 'none' }}>
          {commands.map((c) => (
            <li key={c}>
              <h4
                style={{
                  border: lastText.includes(c) ? '1px solid lightblue' : 'none',
                }}
              >
                {c}
              </h4>
            </li>
          ))}
        </ul>
      </div>
    );
}