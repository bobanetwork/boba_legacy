export const openAlert = data => ({
    type: 'UI/ALERT/UPDATE',
    payload: data
})

export const openError = data => ({
    type: 'UI/ERROR/UPDATE',
    payload: data
})

export const closeAlert = data => ({
    type: 'UI/ALERT/UPDATE',
    payload: null
})

export const closeError = data => ({
    type: 'UI/ERROR/UPDATE',
    payload: null
})