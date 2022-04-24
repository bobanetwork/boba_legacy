import networkService from "../../network/networkService"

export const getCAPTCHAImageBegin = data => ({
    type: 'GET_CAPTCHA_IMAGE'
})

export const getCAPTCHAImageSuccess = data => ({
    type: 'GET_CAPTCHA_IMAGE_SUCCESS',
    payload: data
})

export const getCAPTCHAImageFailure = data => ({
    type: 'GET_CAPTCHA_IMAGE_FAILURE'
})

export const getCAPTCHAImage = () => async (dispatch) =>{
    dispatch(getCAPTCHAImageBegin())
    const data = await networkService.getCAPTCHAImage()
    if (!data) {
        dispatch(getCAPTCHAImageFailure())
    } else {
        dispatch(getCAPTCHAImageSuccess(data))
    }
}