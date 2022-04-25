import networkService from "../../network/networkService"


export const updateNetworkBegin = data => ({
    type: 'UPDATE_NETWORK'
})

export const updateNetworkSuccess = data => ({
    type: 'UPDATE_NETWORK_SUCCESS',
    payload: data
})

export const updateNetworkFailure = data => ({
    type: 'UPDATE_NETWORK_FAILURE'
})

export const updateNetworkInfo = () => async (dispatch) =>{
    dispatch(updateNetworkBegin())
    const data = await networkService.getNetworkInfo()
    if (!Object.keys(data)) {
        dispatch(updateNetworkFailure())
    } else {
        dispatch(updateNetworkSuccess(data))
    }
}