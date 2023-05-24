import { useEffect, useState } from 'react';
import { hooks, startRecognition, stopRecognition } from '../../voice';

export function VoiceCommands() {
    const [on, setOn] = useState(false);
    const lastText = hooks.lastText();
    const menu = hooks.currentMenu();
    const commands = Object.keys(menu);

    useEffect(() => {
        on ? startRecognition() : stopRecognition();
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
        <ul>
          {commands.map((c) => (
            <li key={c}>
              <h4>{c}</h4>
            </li>
          ))}
        </ul>
      </div>
    );
}