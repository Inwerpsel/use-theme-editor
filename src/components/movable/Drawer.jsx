import {Area} from './Area';
import React, {useContext} from 'react';
import {ToggleButton} from '../controls/ToggleButton';
import {AreasContext} from './MovablePanels';

export function Drawer({children}) {
  const {
    drawerOpen, setDrawerOpen,
  } = useContext(AreasContext);

  return <div id={'drawer-wrapper'}>
    <Area id="drawer" data-open={drawerOpen}>
      {children}
    </Area>

    <ToggleButton id="drawer-opener" controls={[drawerOpen, setDrawerOpen]}>
      Drawer
    </ToggleButton>
  </div>;
}
