import mediaQuery from 'css-mediaquery';
import {useContext} from 'react';
import {ThemeEditorContext} from './ThemeEditor';

// Whether a variable is overridden by a later media query.
export const isOverridden = ({media, width, cssVar}) => {
  const {overridingMedia} = cssVar.allVar || cssVar;

  let found = !media;

  return !!overridingMedia && overridingMedia.some(({media, cssVar: queryVar})=> {
    if (found) {
      // The order should correspond to CSS order. So after we found the current var name it should start
      // checking if a later one overrides it.
      return mediaQuery.match(media, {type: 'screen', width});
    }
    if (queryVar.name === cssVar.name) {
      found = true;
    }
    return false;
  });
};

export const VariableScreenSwitcher = props => {
  const {
    cssVar,
    media,
  } = props;

  const {
    width: screenWidth,
    screenOptions,
    setWidth,
    setHeight,
  } = useContext(ThemeEditorContext);

  return <ul className={'variable-screen-switcher'}>
    {screenOptions
      .filter(({dims: [width]}) => {
        if (width === screenWidth) {
          return false;
        }
        if (media && !mediaQuery.match(media, {type: 'screen', width})) {
          return false;
        }

        // This var matches the screen, let's check if it's being overridden by another one.
        return !isOverridden({media, width, cssVar});
      }, [])
      .map(({label, dims: [width, height]}) => <li key={label}>
        <button
          title={`Switch to ${label}`}
          onClick={event => {
            setWidth(width);
            setHeight(height);
            event.preventDefault();
            event.stopPropagation();
          }}>
          <span className={'variable-screen-switcher-screen'}
            style={{
              width: `${width / 42}px`,
              height: `${height / 42}px`,
            }}
          ></span>
        </button>
      </li>)}
  </ul>;
};
