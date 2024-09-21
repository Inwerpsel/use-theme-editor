import React from 'react';

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.body.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

export function FullscreenToggle() {

    return (
      <button onClick={toggleFullscreen}>
        fullscreen
      </button>
    );
}