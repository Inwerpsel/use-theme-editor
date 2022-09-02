import { useState } from "react";

export function Tabs(props) {
  const { children } = props;
  const [activeId, setActiveId] = useState(null);

  const activeTab = children.find(({props: {id}}) => {
      return id === activeId;
  }) || children[0];

  return (
    <div>
      <ul
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          listStyleType: 'none',
          marginBottom: '-10px',
        }}
      >
        {children.map((element) => {
            const {props: {id}} = element;
            return (
              <li
                key={id}
                style={{
                  marginBottom: 0,
                }}
              >
                <button
                  style={{
                    backgroundColor:
                      element === activeTab ? 'white' : 'transparent',
                    border: '2px solid black',
                    borderRadius: '8px',
                    borderBottomRightRadius: '0',
                    borderBottomLeftRadius: '0',
                    borderBottom: 'none',
                    margin: 0,
                  }}
                  onClick={() => setActiveId(id)}
                >
                  {id}
                </button>
              </li>
            );
        })}
      </ul>
      <div style={{background: 'white'}} className="tab-content">{activeTab}</div>
    </div>
  );
}

export function ExampleTabs() {
    return <Tabs>
        <div id="First">
            <h2>First</h2>
            <p>The content of First.</p>
        </div>
        <div id="Second">
            <h2>Second</h2>
            <p>The content of Second.</p>
        </div>
        <div id="Third">
            <h2>Third</h2>
            <p>The content of Third.</p>
        </div>
        <div id="Fourth">
            <h2>Fourth</h2>
            <p>The content of Fourth.</p>
        </div>
        <div id="Fifth">
            <h2>Fifth</h2>
            <p>The content of Fifth.</p>
        </div>
    </Tabs>;
}