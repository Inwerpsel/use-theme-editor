import React, { useState } from "react";
import { use } from "../../state";
import { Checkbox } from "../controls/Checkbox";
import { TextControl } from "../controls/TextControl";
import { useCompactSetting } from "../movable/DispatchedElement";
import { DragHandle } from "../movable/DragHandle";
import { ThemeEditorContext } from "../ThemeEditor";
import { CompactModeButton } from "./CompactModeButton";

function generateId () {
  return '_' + Math.random().toString(36).substr(2, 9);
}

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
    const [nameReplacements, setNameReplacements] = use.nameReplacements();

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
                    <TextControl
                      value={from}
                      onChange={(value) => {
                        setNameReplacements((r) =>
                          updateReplacement(r, {
                            ...replacement,
                            from: value,
                          })
                        );
                      }}
                      placeholder="From"
                    />
                    <TextControl
                      value={to}
                      onChange={(value) => {
                        setNameReplacements((r) =>
                          updateReplacement(r, {
                            ...replacement,
                            to: value,
                          })
                        );
                      }}
                      placeholder="From"
                    />
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
              <TextControl
                value={newFrom}
                onChange={setNewFrom}
                placeholder="From"
              />
              <TextControl
                value={newTo}
                onChange={setNewTo}
                placeholder="To"
              />
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