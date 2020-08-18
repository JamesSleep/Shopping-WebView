import types from "../action/Types";

const url = "https://3456shop.com/";

export default (state = url, action) => {
  switch (action.type) {
    case types.FCM_LOAD:
      return action.payload;
    default:
      return state;
  }
};