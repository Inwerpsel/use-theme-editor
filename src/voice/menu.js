import {state} from './menu/state';
import {history} from './menu/history';
import {scroll} from './menu/scroll';
import { toggleRecognition } from '.';

export const homeMenu = {
  state,
  history,
  scroll,
  'over and out': toggleRecognition,
};
