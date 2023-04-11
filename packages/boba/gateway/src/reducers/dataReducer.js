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

<<<<<<< HEAD
import keyBy from 'lodash/keyBy';
=======
import { keyBy } from 'util/lodash';
>>>>>>> 19f2eb6385e0e61b0256bf25b05495fb19a83274

const initialState = {
  sevens: {},
  fastExits: {}
}

function dataReducer (state = initialState, action) {
  switch (action.type) {
    case 'SEVENS/GETALL/SUCCESS':
      return {
        ...state,
        sevens: {
          ...keyBy(action.payload, 'blockNumber', 'hash')
        }
      }
  case 'FASTEXITS/GETALL/SUCCESS':
    return {
      ...state,
      fastExits: {
        ...keyBy(action.payload, 'blockNumber', 'hash')
      }
    }
  default:
      return state
  }
}

export default dataReducer
