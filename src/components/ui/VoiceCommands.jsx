import { useEffect, useState } from 'react';
import { hooks, recognitionIsRunning, startRecognition, stopRecognition } from '../../voice';

export function VoiceCommands() {
    const [on, setOn] = useState(true);
    const lastText = hooks.lastText();
    const menu = hooks.currentMenu();
    const commands = Object.keys(menu);

    useEffect(() => {
      if (on) {
          try {
            startRecognition();
          } catch (e) {
            // It's already running.
          }
      } else {
        stopRecognition();
      }
    }, [on])

    return (
      <div style={on ? {} : {cursor: 'pointer'}} onClick={() => setOn(!on)}>
        {on ? (
          <span
            style={{
              float: 'right',
              border: '2px solid lightblue',
              borderRadius: '4px',
            }}
          >
            Listening
          </span>
        ): <span style={{float: 'right'}}>click to start</span>}

        <b>Last text:</b>
        <span>{lastText}</span>
        <br/>
        <br/>
        <ul style={{listStyleType: 'none'}}>
          {commands.map((c) => (
            <li key={c}>
              <h4 style={{
                border: lastText.includes(c) ? '1px solid lightblue' : 'none',
              }}>{c}</h4>
            </li>
          ))}
        </ul>
      </div>
    );
}