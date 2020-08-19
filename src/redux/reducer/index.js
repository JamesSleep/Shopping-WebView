import { combineReducers } from "redux";
import UrlReducer from "./UrlReducer";

export default combineReducers({
  url: UrlReducer
});