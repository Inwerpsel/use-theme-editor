import { get, use } from '../../state';

export function PickedValue() {
  const [v, setV] = use.pickedValue();
  const empty = v === '';

  return (
    <div>
      {/* <button disabled={empty} onClick={() => {setV('')}}>drop</button> */}
      {!empty && (
        <span onClick={() => {setV('')}} style={{ background: v, width: '32px', height: '32px' }}>
          {v}
        </span>
      )}
    </div>
  );
}
