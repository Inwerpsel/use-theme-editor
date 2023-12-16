import { historyBack, historyForward } from "../../hooks/useResumableReducer";

export const history = {
  back: () => {
    historyBack();
  },
  forward: () => {
     historyForward();
  },
};