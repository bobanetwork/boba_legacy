/*
Copyright 2021-present Boba Network.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import { createStore , applyMiddleware } from 'redux'
import RootReducer from 'reducers'
import reduxThunk from 'redux-thunk'
import persistReducer from 'redux-persist/lib/persistReducer'
import storage from 'redux-persist/lib/storage'
import persistStore from 'redux-persist/lib/persistStore'

const initialState = {}

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['network']
}

const persistedReducer = persistReducer(persistConfig, RootReducer)

export const store = createStore(
  persistedReducer,
  initialState,
  applyMiddleware(reduxThunk)
)

export default store;

export const persistor = persistStore(store)
