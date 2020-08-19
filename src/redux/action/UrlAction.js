import types from './Types';

export function UrlUpdate(url) {
  return {
    type: types.FCM_LOAD,
    payload: url
  };
}