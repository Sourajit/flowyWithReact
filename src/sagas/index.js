/* eslint-disable no-constant-condition */

import { put, takeEvery, delay } from 'redux-saga/effects'

export function* updateSaga() {
  console.log("updateSaga");
  yield delay(1000)
  yield put({ type: '_UPDATE' })
}

export default function* rootSaga() {
  console.log("rootSaga");
  yield takeEvery('UPDATE', updateSaga)
}
