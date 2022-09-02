import React, { useState, useContext } from "react";
import { generateId } from "../../hooks/useId";
import { Checkbox } from "../controls/Checkbox";
import { ThemeEditorContext } from "../ThemeEditor";

function addReplacement(replacements, newEntry) {
    return [
        ...replacements,
        {
            ...newEntry,
            order: replacements.reduce((max,r) => Math.max(max,r), -1) + 1,
        },
    ];
}

function updateReplacement(replacements, updated) {
    return replacements.map((r) => (r.id !== updated.id ? r : updated));
}

function deleteReplacement(replacements) {

}

export function byOrder({ order: a }, { order: b }) {
    return a - b;
}

export function NameReplacements() {
    const {nameReplacements, setNameReplacements} = useContext(ThemeEditorContext);

    const [newFrom, setNewFrom] = useState('');
    const [newTo, setNewTo] = useState('');

    return (
      <div>
        <h4>
            Replace strings in names.
        </h4>
        <ul style={{maxHeight: '30vh', overflowY: 'auto'}}>
          {nameReplacements
            .sort(byOrder)
            .map((replacement) => {
              const { id, from, to, order, active } = replacement;

              return (
                <li key={id} style={{ display: 'flex' }}>
                  <div>
                    <input
                      value={from}
                      onChange={(event) => {
                        const value = event.target.value;
                        setNameReplacements((nameReplacements) =>
                          updateReplacement(nameReplacements, {
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
                        setNameReplacements((nameReplacements) =>
                          updateReplacement(nameReplacements, {
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
                      setNameReplacements((nameReplacements) =>
                        updateReplacement(nameReplacements, {
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
                      setNameReplacements((nameReplacements) =>
                        updateReplacement(nameReplacements, {
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
                        setNameReplacements((replacements) =>
                          updateReplacement(replacements, {
                            ...replacement,
                            active: !active,
                          })
                        ),
                    ]}
                  />
                  <button
                    onClick={() => {
                      setNameReplacements((nameReplacements) =>
                        nameReplacements.filter((r) => r.id !== id)
                      );
                    }}
                  >
                    X
                  </button>
                </li>
              );
            })}
        </ul>
        <div style={{display: 'flex'}}>
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
                  nameReplacements => addReplacement(nameReplacements, {
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
        </div>
      </div>
    );
}