/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

export function createAction (key, asyncAction) {

  return async function (dispatch) {

    dispatch({ type: `${key}/REQUEST` })

    try {
      const response = await asyncAction()

      if( response === false ) {
        return false
      }

      if(response && typeof(response) === 'string' && response.includes('execution reverted: ERC20Permit')) {
        let errorMessage = JSON.parse(response)
        dispatch({ type: `UI/ERROR/UPDATE`, payload: errorMessage.error.message })
        dispatch({ type: `${key}/ERROR` })
        return false
      }

      //deal with metamask errors - they will have a 'code' field so we can detect those
      if(response && response.hasOwnProperty('message') && response.hasOwnProperty('code')) {

        console.log("Error keys:", Object.keys(response))
        console.log("Error code:", response.code)
        if(response.hasOwnProperty('reason')) console.log("Error reason:", response.reason)

        // the basic error message
        let errorMessage = response.message

        // provide more information in special cases
        // MetaMask user rejected sig - throw up a banner
        if (response.code === 4001) {
          console.log("MetaMask: user denied signature")
          errorMessage = 'MetaMask: Transaction was rejected by user - signature denied'
        }
        // No internet case - throw up a banner
        else if(response.hasOwnProperty('reason') && response.reason.includes('could not detect network')) {
          console.log("Gateway error: No network")
          errorMessage = 'Gateway: No internet'
        }
        // ethers error
        else if(response.hasOwnProperty('reason') && response.reason.includes('missing revert data in call exception')) {
          console.log("Slow network or rate throttling - code 1")
          // intercept error
          return false
        }
        // ethers error
        else if(response.hasOwnProperty('reason') && response.reason.includes('resolver or addr is not configured for ENS name')) {
          console.log("Slow network or rate throttling - code 2")
          // intercept error
          return false
        }
        // ethers error
        else if(response.hasOwnProperty('reason') && response.reason.includes('missing response')) {
          console.log("Slow network or rate throttling - code 3")
          // intercept error
          return false
        }

        dispatch({ type: `UI/ERROR/UPDATE`, payload: errorMessage })
        dispatch({ type: `${key}/ERROR` })

        return false
      }

      dispatch({ type: `${key}/SUCCESS`, payload: response })
      return true

    } catch (error) {

      console.log("Unhandled error RAW:", {error, key, asyncAction})

      return false
    }
  }
}
