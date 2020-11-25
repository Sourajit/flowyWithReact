import produce from "immer"
const initialState = {
  "loaded": false,
  "absx": 0,
  "absy": 0,
  "active": false,
  "offsetleft": 0,
  "dragx": "",
  "dragy": "",
  "dragblock": false,
  "prevblock": 0
}

const reducer = produce((draft, action) => {
  switch (action.type) {
    case 'UPDATE':
      draft[action.key] = action.payload;
      return draft
    case 'DELETE':
      draft[action.key] = [];
      return draft;
    case 'UPDATE_LIST_ITEM':
      draft[action.key].map((item)=> (item.id === action.payload.id)? action.payload :item)
      return draft;
    case 'PUSH':
      draft[action.key].push(action.payload);
      return draft;
    default:
      return draft
  }
},initialState);

export default reducer;