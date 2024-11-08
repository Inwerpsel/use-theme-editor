import React, { Fragment, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { ThemeEditorContext } from '../ThemeEditor';

function toggleFullscreen() {
  if (document.fullscreenElement !== this) {
    this.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function FullscreenToggle() {
    const {
      frameRef,
    } = useContext(ThemeEditorContext);

    const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

    const previewButton = (
      <button
        onClick={() => {
          const node = frameRef.current?.parentNode;
          setIsFullscreenPreview(document.fullscreenElement !== node);
          toggleFullscreen.bind(node)();
        }}
      >
        fullscreen preview
      </button>
    );

    const buttons = (
      <Fragment>
        <button onClick={toggleFullscreen.bind(document.body)}>
          fullscreen
        </button>
        {previewButton}
      </Fragment>
    );
    return <Fragment>
      {buttons}
      {isFullscreenPreview && createPortal(<div style={{ position: 'fixed', top: 0, right: 0}}>{previewButton}</div>, frameRef.current?.parentNode)}
    </Fragment>
}

FullscreenToggle.fName = 'FullscreenToggle';