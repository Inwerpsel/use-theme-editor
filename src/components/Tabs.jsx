import { memo, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useResumableState } from "../hooks/useResumableReducer";

// This component is functional, but I have no use case yet.
// Tabs mean that you can only access one of the items at a time,
// which goes against the philosophy of allowing any component to be
// on the screen at any time.
// To not conflict with this, tabs would need to be optional and user editable.
export function Tabs(props) {
  const { children, stateHook = useState } = props;
  const [activeId, setActiveId] = stateHook(null);

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
            const {props: {id, title}} = element;
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
                  {title || id}
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

const initialData = [
  {id: 1, title: 'Tab 1', description: 'This is the first tab'},
  {id: 2, title: 'Tab 2', description: 'This is the second tab'},
  {id: 3, title: 'Tab 3', description: 'This is the third tab'},
]
let i = initialData.length;

function hook() {
  return useLocalStorage('exampleTab', 'Tab 2')
}

const EditableHeading = memo(function EditableHeading(props) {
  const { children, onChange, id } = props;
  const ref = useRef();
  // const [restore, setRestore] = useState();
  const [isEdit, setIsEdit] = useState(false)

  // useEffect(() => {
  //   restore && restore()
  // } ,[children])
  
  return (
    <h2
      onClick={() => {
        !isEdit && setIsEdit(true);
      }}
      onFocus={() => {
        console.log('in');
        setIsEdit(true);
      }}
      onBlur={() => {
        console.log('out');
        setIsEdit(false);
      }}
      {...{ref}}
      onInput={(e) => {
        // setRestore(saveCaretPosition(ref))
        onChange(e.currentTarget.textContent);
      }}
      contentEditable={isEdit}
    >
      {children}
    </h2>
  );
}, (a,b) => a.id === b.id)

function saveCaretPosition(ref){
  var selection = window.getSelection();
  var range = selection.getRangeAt(0);
  range.setStart(  ref.current, 0 );
  var len = range.toString().length;

  return function restore(){
      var pos = getTextNodeAtPosition(ref.current, len);
      selection.removeAllRanges();
      var range = new Range();
      range.setStart(pos.node ,pos.position);
      selection.addRange(range);

  }
}

function getTextNodeAtPosition(root, index){
  const NODE_TYPE = NodeFilter.SHOW_TEXT;
  var treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(elem) {
      if(index > elem.textContent.length){
          index -= elem.textContent.length;
          return NodeFilter.FILTER_REJECT
      }
      return NodeFilter.FILTER_ACCEPT;
  });
  var c = treeWalker.nextNode();
  return {
      node: c? c: root,
      position: index
  };
}

export function ExampleDynamicTabs() {
  const [data, setData] = useResumableState('foo', initialData);
  
  return (
    <div>
      <button
        onClick={() => {
          setData([
            ...data,
            { id: ++i, title: `Tab ${i}`, description: '' },
          ]);
        }}
      >
        new
      </button>
      <Tabs stateHook={hook}>
        {data.map(({ id, title, description }, index) => (
          <div {...{id, title}}>
            <EditableHeading
              {...{id}}
              onChange={(value) => setData(data.map((item, i) => index !== i ? item : { ...item, title: value }))}
            >
              {title}</EditableHeading>
            <p
              onInput={(e) => {
                setData(
                  data.map((item, i) =>
                    index !== i
                      ? item
                      : { ...item, description: e.currentTarget.textContent }
                  )
                );
              }}
              // contentEditable={isEdit}
            >
              {description}
            </p>
            <button
              onClick={() => {
                setData(
                  data.filter((prevData, prevIndex) => prevIndex !== index)
                );
              }}
            >
              remove
            </button>
          </div>
        ))}
      </Tabs>
    </div>
  );
}