import React, { useState, useContext } from "react";
import { generateId } from "../../hooks/useId";
import { Checkbox } from "../controls/Checkbox";
import { useCompactSetting } from "../movable/DispatchedElement";
import { DragHandle } from "../movable/DragHandle";
import { ThemeEditorContext } from "../ThemeEditor";
import { CompactModeButton } from "./CompactModeButton";

function addReplacement(replacements, newEntry) {
    return [
        ...replacements,
        {
            ...newEntry,
            order: replacements.reduce((max,r) => Math.max(max,r), -1) + 1,
        },
    ].sort(byOrder);
}

function byOrder({ order: a }, { order: b }) {
    return a - b;
}

function updateReplacement(replacements, updated) {
    return replacements.map((r) => (r.id !== updated.id ? r : updated)).sort(byOrder);
}

export function NameReplacements() {
    const {nameReplacements, setNameReplacements} = useContext(ThemeEditorContext);

    const [newFrom, setNewFrom] = useState('');
    const [newTo, setNewTo] = useState('');
    const [isCompact, setIsCompact] = useCompactSetting();

    return (
      <div>
        <DragHandle/>
        <CompactModeButton {...{isCompact, setIsCompact}}/>
        <h4>
            Replace strings in names
        </h4>
        {!isCompact && <ul style={{maxHeight: '30vh', overflowY: 'auto'}}>
          {nameReplacements.map((replacement) => {
              const { id, from, to, order, active } = replacement;

              return (
                <li key={id} style={{ display: 'flex' }}>
                  <div>
                    <input
                      value={from}
                      onChange={(event) => {
                        const value = event.target.value;
                        setNameReplacements((r) =>
                          updateReplacement(r, {
                            ...replacement,
                            from: value,
                          })
                        );
                      }}
                      type="text"
                      placeholder="From"
                    ></input>
                    <input
                      value={to}
                      onChange={(event) => {
                        const value = event.target.value;
                        setNameReplacements((r) =>
                          updateReplacement(r, {
                            ...replacement,
                            to: value,
                          })
                        );
                      }}
                      type="text"
                      placeholder="From"
                    ></input>
                  </div>
                  <button
                    onClick={() => {
                      setNameReplacements((r) =>
                        updateReplacement(r, {
                          ...replacement,
                          order: order - 1,
                        })
                      );
                    }}
                  >
                    down
                  </button>
                  <button
                    onClick={() => {
                      setNameReplacements((r) =>
                        updateReplacement(r, {
                          ...replacement,
                          order: order + 1,
                        })
                      );
                    }}
                  >
                    up
                  </button>
                  <Checkbox
                    controls={[
                      active,
                      () =>
                        setNameReplacements((r) =>
                          updateReplacement(r, {
                            ...replacement,
                            active: !active,
                          })
                        ),
                    ]}
                  />
                  <button
                    onClick={() => {
                      setNameReplacements((r) =>
                        r.filter((r) => r.id !== id)
                      );
                    }}
                  >
                    X
                  </button>
                </li>
              );
            })}
        </ul>}
        {!isCompact && <div style={{display: 'flex'}}>
            <div>
              <input
                value={newFrom}
                onChange={(event) => {
                  setNewFrom(event.target.value);
                }}
                type="text"
                placeholder="From"
              ></input>
              <input
                value={newTo}
                onChange={(event) => {
                  setNewTo(event.target.value);
                }}
                type="text"
                placeholder="To"
              ></input>
            </div>
            <button
              disabled={newFrom.length < 2 || newTo.length < 1}
              onClick={() => {
                setNameReplacements(
                  r => addReplacement(r, {
                    id: generateId(),
                    to: newTo,
                    from: newFrom,
                    active: true,
                  })
                );
                setNewTo('');
                setNewFrom('');
              }}
            >
              Add
            </button>
        </div>}
      </div>
    );
}