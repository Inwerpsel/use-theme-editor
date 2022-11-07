import React, {useState} from 'react';
import {IdeLink} from './IdeLink';
import {ElementLocator} from '../ui/ElementLocator';

const currentSelectorStyle = {
  background: 'yellow',
};

export const VariableUsages = ({usages, maxSpecificSelector, winningSelector}) => {
  const [openSelectors, setOpenSelectors] = useState({});
  const visitedSelectors = {};

  const uniqueUsages = usages.filter(({selector}) => {
    if (selector in visitedSelectors) {
      visitedSelectors[selector]++;
      return false;
    }
    visitedSelectors[selector] = 1;

    return true;
  })

  if (usages.length === 1 && !usages[0].selector) {
    return null;
  }

  return <ul>
    {uniqueUsages.map(({property, selector, position}) => {
      const selectors = selector.split(',');
      const highLightMatch = usages.length > 1 && selector === maxSpecificSelector;
      
      if (selectors.length > 1 && selectors.some(selector => selector.length > 10)) {
        return <li key={selector}>
          {!!position && <IdeLink {...position}/>}
          <h4
            style={!highLightMatch ? {} : currentSelectorStyle}
            onClick={() => setOpenSelectors({ ...openSelectors, [selector]: !openSelectors[selector] })}
            >
            Combined: 
            <div className='monospace-code'>{selector.replaceAll(/\s*\,\s*/g, ',\n').trim().substring(0, 100)}</div>
          </h4>
          {!!openSelectors[selector] && <ul style={{marginLeft: '16px'}}>
            {selectors.map(selector => <li key={selector} style={selector !== winningSelector ? {} : currentSelectorStyle}>
              <ElementLocator selector={selector} initialized showLabel={true}/>
              <span className='monospace-code'> ({property})</span>
            </li>)}
          </ul>}
        </li>;
      }

      return <li key={selector} style={!highLightMatch ? {} : currentSelectorStyle}>
        {!!position && <IdeLink {...position}/>}
        <ElementLocator selector={selector} initialized showLabel={true}/>
        <span> ({property})</span>
      </li>;
    })}
  </ul>;
};
