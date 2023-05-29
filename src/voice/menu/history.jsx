import { historyDispatch } from "../../hooks/useResumableReducer";

export const history = {
    back: () => {
         historyDispatch({type: 'HISTORY_BACKWARD'});
    },
    forward: () => {
         historyDispatch({type: 'HISTORY_FORWARD'});
    },
};