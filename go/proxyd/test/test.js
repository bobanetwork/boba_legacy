/* eslint-disable prefer-arrow/prefer-arrow-functions */
const axios = require('axios').default

;(async () => {
  try {
    const to = process.argv.slice(2)[0] // Address of the node
    //case 1
    const id1 = 1
    const obj1 = {
      jsonrpc: '2.0',
      id: id1,
      method: 'eth_blockNumber',
      params: [],
    }
    const test1 = 'TEST CASE 1 -- STANDARD REQUEST ID NUMBER'
    axios
      .post(to, obj1)
      .then(function (response) {
        if (response.data.id === id1) {
          console.log(test1 + ' PASSED')
        } else {
          throw new Error(test1)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 2
    const id2 = '1'
    const obj2 = {
      jsonrpc: '2.0',
      id: id2,
      method: 'eth_blockNumber',
      params: [],
    }
    const test2 = 'TEST CASE 2 -- STANDARD REQUEST ID STRING'
    axios
      .post(to, obj2)
      .then(function (response) {
        if (response.data.id === id2) {
          console.log(test2 + ' PASSED')
        } else {
          throw new Error(test2)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 3
    const id3 = '1sdsasd-32783-dsjfhsujd'
    const obj3 = {
      jsonrpc: '2.0',
      id: id3,
      method: 'eth_blockNumber',
      params: [],
    }
    const test3 = 'TEST CASE 3 -- STANDARD REQUEST ID RANDOM STRING'
    axios
      .post(to, obj3)
      .then(function (response) {
        if (response.data.id === id3) {
          console.log(test3 + ' PASSED')
        } else {
          throw new Error(test3)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 4
    const id4 = '1sdsasd-32783-dsjfhsujd'
    const obj4 = [
      {
        jsonrpc: '2.0',
        id: id4,
        method: 'eth_blockNumber',
        params: [],
      },
    ]
    const test4 = 'TEST CASE 4 -- BATCH REQUEST SINGLE'
    axios
      .post(to, obj4)
      .then(function (response) {
        if (response.data[0].id === id4) {
          console.log(test4 + ' PASSED')
        } else {
          throw new Error(test4)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 5
    const id5 = '1sdsasd-32783-dsjfhsujd'
    const obj5 = [
      {
        jsonrpc: '2.0',
        id: id5,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id5,
        method: 'eth_blockNumber',
        params: [],
      },
    ]
    const test5 = 'TEST CASE 5 -- BATCH REQUEST MULTIPLE'
    axios
      .post(to, obj5)
      .then(function (response) {
        response.data.forEach((element) => {
          if (element.id === id5) {
            console.log(test5 + ' PASSED')
          } else {
            throw new Error(test5 + element)
          }
        })
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 6
    const id6 = '1sdsasd-32783-dsjfhsujd'
    const obj6 = [
      {
        jsonrpc: '2.0',
        id: id6,
        method: 'eth_blockNumberrr',
        params: [],
      },
    ]
    const test6 = 'TEST CASE 6 -- ERRROR REQUEST'
    axios
      .post(to, obj6)
      .then(function (response) {
        if (response.data.error.message === 'rpc method is not whitelisted') {
          console.log(test6 + ' PASSED')
        } else {
          throw new Error(test6)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 7
    const id7_1 = '1sdsasd-32783-dsjfhsujda'
    const id7_2 = '1sdsasd-32783-dsjfhsujd'
    const id7_3 = '1sdsasd-32783-dsjfhsujda'
    const obj7 = [
      {
        jsonrpc: '2.0',
        id: id7_1,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id7_2,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id7_3,
        method: 'eth_blockNumber',
        params: [],
      },
    ]
    const test7 = 'TEST CASE 7 -- BATCH REQUEST MULTIPLE'
    axios
      .post(to, obj7)
      .then(function (response) {
        i = 0
        response.data.forEach((element) => {
          if (i === 0) {
            if (element.id === id7_1) {
              console.log(test7 + ' PASSED')
            } else {
              throw new Error(test7)
            }
          }
          if (i === 1) {
            if (element.id === id7_2) {
              console.log(test7 + ' PASSED')
            } else {
              throw new Error(test7)
            }
          }
          if (i === 2) {
            if (element.id === id7_3) {
              console.log(test7 + ' PASSED')
            } else {
              throw new Error(test7)
            }
          }
          i++
        })
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 8
    const id8_1 = 1
    const id8_2 = 2
    const id8_3 = 3
    const obj8 = [
      {
        jsonrpc: '2.0',
        id: id8_1,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id8_2,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id8_3,
        method: 'eth_blockNumber',
        params: [],
      },
    ]
    const test8 = 'TEST CASE 8 -- BATCH REQUEST MULTIPLE WITH INTEGERS'
    axios
      .post(to, obj8)
      .then(function (response) {
        i = 0
        response.data.forEach((element) => {
          if (i === 0) {
            if (element.id === id8_1) {
              console.log(test8 + ' PASSED')
            } else {
              throw new Error(test8)
            }
          }
          if (i === 1) {
            if (element.id === id8_2) {
              console.log(test8 + ' PASSED')
            } else {
              throw new Error(test8)
            }
          }
          if (i === 2) {
            if (element.id === id8_3) {
              console.log(test8 + ' PASSED')
            } else {
              throw new Error(test8)
            }
          }
          i++
        })
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 9
    const id9_1 = '1'
    const id9_2 = '2'
    const id9_3 = '3'
    const obj9 = [
      {
        jsonrpc: '2.0',
        id: id9_1,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id9_2,
        method: 'eth_blockNumber',
        params: [],
      },
      {
        jsonrpc: '2.0',
        id: id9_3,
        method: 'eth_blockNumber',
        params: [],
      },
    ]
    const test9 = 'TEST CASE 9 -- BATCH REQUEST MULTIPLE WITH STRING IDS'
    axios
      .post(to, obj9)
      .then(function (response) {
        i = 0
        response.data.forEach((element) => {
          if (i === 0) {
            if (element.id === id9_1) {
              console.log(test9 + ' PASSED')
            } else {
              throw new Error(test9)
            }
          }
          if (i === 1) {
            if (element.id === id9_2) {
              console.log(test9 + ' PASSED')
            } else {
              throw new Error(test9)
            }
          }
          if (i === 2) {
            if (element.id === id9_3) {
              console.log(test9 + ' PASSED')
            } else {
              throw new Error(test9)
            }
          }
          i++
        })
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 10
    const obj10_id = '1'
    const obj10 = {
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [
        {
          from: '0x3C99545602fF72723e813DC31F696cD893E5E525',
          to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
          gas: '0x76c0',
          gasPrice: '0x9184e72a000',
          value: '0x9184e72a',
          data: '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
        },
      ],
      id: obj10_id,
    }
    const test10 = 'TEST CASE 10 -- ESTIMATE GAS WITH STRING ID'
    axios
      .post(to, obj10)
      .then(function (response) {
        if (response.data.id === obj10_id) {
          console.log(test10 + ' PASSED')
        } else {
          throw new Error(test10)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
    //case 11
    const obj11_id = 1
    const obj11 = {
      jsonrpc: '2.0',
      method: 'eth_estimateGas',
      params: [
        {
          from: '0x3C99545602fF72723e813DC31F696cD893E5E525',
          to: '0xd46e8dd67c5d32be8058bb8eb970870f07244567',
          gas: '0x76c0',
          gasPrice: '0x9184e72a000',
          value: '0x9184e72a',
          data: '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675',
        },
      ],
      id: obj11_id,
    }
    const test11 = 'TEST CASE 11 -- ESTIMATE GAS WITH INTEGER ID'
    axios
      .post(to, obj11)
      .then(function (response) {
        if (response.data.id === obj11_id) {
          console.log(test11 + ' PASSED')
        } else {
          throw new Error(test11)
        }
      })
      .catch(function (error) {
        console.log(error)
      })
  } catch (e) {
    console.log
  }
})()
