let token

const ERC20 = artifacts.require('ERC20')

contract('ERC20', (accounts) => {

  const tokenName = 'My Optimistic Coin'
  const tokenSymbol = 'OPT'
  const tokenDecimals = 1
  const creator = accounts[0]

  beforeEach(async () => {
    
    token = await ERC20.new(
      10000, 
      tokenName, 
      tokenDecimals, 
      tokenSymbol, 
      { 
        from: accounts[0]
      }
    )
  })

  it('creation: should create an initial balance of 10000 for the creator', async () => {
    const balance = await token.balanceOf.call(accounts[0])
    assert.strictEqual(balance.toNumber(), 10000)
  })

  it('creation: test correct setting of vanity information', async () => {
    const name = await token.name.call()
    assert.strictEqual(name, tokenName)

    const decimals = await token.decimals.call()
    assert.strictEqual(decimals.toNumber(), tokenDecimals)

    const symbol = await token.symbol.call()
    assert.strictEqual(symbol, tokenSymbol)
  })

  it('creation: should succeed in creating over 2^256 - 1 (max) tokens', async () => {
    // 2^256 - 1
    const token2 = await ERC20.new('115792089237316195423570985008687907853269984665640564039457584007913129639935', 'Simon Bucks', 1, 'SBX', { from: accounts[ 0 ] })
    const totalSupply = await token2.totalSupply()
    assert.strictEqual(totalSupply.toString(), '115792089237316195423570985008687907853269984665640564039457584007913129639935')
  })

  // TRANSFERS
  // normal transfers without approvals
  it('transfers: ether transfer should be reversed.', async () => {
    const balanceBefore = await token.balanceOf.call(accounts[ 0 ])
    assert.strictEqual(balanceBefore.toNumber(), 10000)

    let threw = false
    try {
      await web3.eth.sendTransaction({ from: accounts[ 0 ], to: token.address, value: web3.utils.toWei('10', 'Ether') })
    } catch (e) {
      threw = true
    }
    assert.equal(threw, true)

    const balanceAfter = await token.balanceOf.call(accounts[ 0 ])
    assert.strictEqual(balanceAfter.toNumber(), 10000)
  })

  it('transfers: should transfer 10000 to accounts[1] with accounts[0] having 10000', async () => {
    await token.transfer(accounts[ 1 ], 10000, { from: accounts[ 0 ] })
    const balance = await token.balanceOf.call(accounts[ 1 ])
    assert.strictEqual(balance.toNumber(), 10000)
  })

  it('transfers: should fail when trying to transfer 10001 to accounts[1] with accounts[0] having 10000', async () => {
    let threw = false
    try {
      await token.transfer.call(accounts[ 1 ], 10001, { from: accounts[ 0 ] })
    } catch (e) {
      threw = true
    }
    assert.equal(threw, true)
  })

  it('transfers: should handle zero-transfers normally', async () => {
    assert(await token.transfer.call(accounts[ 1 ], 0, { from: accounts[ 0 ] }), 'zero-transfer has failed')
  })

  // APPROVALS
  it('approvals: msg.sender should approve 100 to accounts[1]', async () => {
    await token.approve(accounts[ 1 ], 100, { from: accounts[ 0 ] })
    const allowance = await token.allowance.call(accounts[ 0 ], accounts[ 1 ])
    assert.strictEqual(allowance.toNumber(), 100)
  })

  it('approvals: approve max (2^256 - 1)', async () => {
    await token.approve(accounts[ 1 ], '115792089237316195423570985008687907853269984665640564039457584007913129639935', { from: accounts[ 0 ] })
    const allowance = await token.allowance(accounts[ 0 ], accounts[ 1 ])
    assert.strictEqual(allowance.toString(), '115792089237316195423570985008687907853269984665640564039457584007913129639935')
  })

  it('events: should fire Transfer event properly', async () => {
    const res = await token.transfer(accounts[ 1 ], '2666', { from: accounts[ 0 ] })
    const transferLog = res.logs.find(
      element => element.event.match('Transfer') &&
        element.address.match(token.address)
    )
    assert.strictEqual(transferLog.args._from, accounts[ 0 ])
    // L2 ETH transfer also emits a transfer event
    assert.strictEqual(transferLog.args._to, accounts[ 1 ])
    assert.strictEqual(transferLog.args._value.toString(), '2666')
  })

  it('events: should fire Transfer event normally on a zero transfer', async () => {
    const res = await token.transfer(accounts[ 1 ], '0', { from: accounts[ 0 ] })
    const transferLog = res.logs.find(
      element => element.event.match('Transfer') &&
        element.address.match(token.address)
    )
    assert.strictEqual(transferLog.args._from, accounts[ 0 ])
    assert.strictEqual(transferLog.args._to, accounts[ 1 ])
    assert.strictEqual(transferLog.args._value.toString(), '0')
  })

  it('events: should fire Approval event properly', async () => {
    const res = await token.approve(accounts[ 1 ], '2666', { from: accounts[ 0 ] })
    const approvalLog = res.logs.find(element => element.event.match('Approval'))
    assert.strictEqual(approvalLog.args._owner, accounts[ 0 ])
    assert.strictEqual(approvalLog.args._spender, accounts[ 1 ])
    assert.strictEqual(approvalLog.args._value.toString(), '2666')
  })
})
