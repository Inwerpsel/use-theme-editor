import {useRef, useState} from 'react';

export function generateId () {
  return '_' + Math.random().toString(36).substr(2, 9);
}

export function useId() {
  return useState(generateId)[0];
}
