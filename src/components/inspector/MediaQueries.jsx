// import {parse} from 'css-mediaquery';

export function MediaQueries({media: mediaString}) {
    // const stuff = parse(mediaString);
    // console.log(stuff);

    return (
      <div>
        <b
          className="monospace-code"
          style={{ fontSize: '14px', background: '#ebe9fb' }}
        >
          {mediaString}
        </b>
      </div>
    );
}