import FontPicker from 'font-picker-react';
import {Fragment, useEffect, useState} from 'react';
import {getAllDefinedFonts} from '../../getAllDefinedFonts';
import {TextControl, SelectControl, CheckboxControl} from '@wordpress/components';
const unquote = s => {
  return s.replace(/^"/, '').replace(/"$/, '');
};

const rawFamily = s => unquote(s.replace(/,.*$/, ''));

// Key meant for public usage.
const googleApiKey = 'AIzaSyBt0d8TsNo0wJn8Pj2zICtBY614IsEqrHw';

export const FontFamilyControl = props => {
  const [googleOn, setGoogleOn] = useState(false);
  const {value, onChange} = props;
  const [fonts, setFonts] = useState([]);

  useEffect(() => {
    const loadFonts = async () => {
      const tStart = performance.now();
      const loaded = await getAllDefinedFonts();
      console.log(`Loaded ${loaded.length} fonts in ms`, performance.now() - tStart);
      setFonts(loaded);
    };
    loadFonts();
  },[]);

  return <Fragment>
    <CheckboxControl
      label={'Use Google picker (might crash)'}
      checked={googleOn}
      onChange={() => setGoogleOn(!googleOn)}
    />
    { !googleOn || fonts.length === 0 ? null : <FontPicker
      apiKey={googleApiKey}
      activeFontFamily={rawFamily(value)}
      families={fonts.map(f => rawFamily(f.fontFamily))}
      onChange={value => {
        onChange(value.family);
      }}
    />}
    <SelectControl
      {...{value, onChange}}
      options={fonts.map(({fontFamily}) => ({label: fontFamily, value: fontFamily}))
      }
    />
    <TextControl {...{value, onChange}}/>
  </Fragment>;

};
