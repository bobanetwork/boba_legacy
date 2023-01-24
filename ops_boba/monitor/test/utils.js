const Timer = (time) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve('TimeOut'), time)
  })
}

const loop = async (func) => {
  while (true) {
    try {
      await func()
    } catch (error) {
      console.log('Unhandled exception during monitor service', {
        message: error.toString(),
        stack: error.stack,
        code: error.code,
      })
      await sleep(1000)
    }
  }
}

module.exports = { Timer, loop }
