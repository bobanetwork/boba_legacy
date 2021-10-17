# Liquidity Pools

<img width="1243" alt="LP" src="https://user-images.githubusercontent.com/46272347/119060612-6455cc00-b987-11eb-9f8c-dfadfa029951.png">

For each supported token, there are two pools, on on the L1, and the other, on the L2.

When a user wishes to bridge funds into the L2 (`fast bridge to L2`), the user deposits funds into the L1 pool, triggering a message to be sent cross-chain to the L2 pool, which then sends the correct amount of funds to the user's L2 wallet. Likewise, the `fast bridge to L1` consists of a user depositing funds into the L2 pool, which then triggers the L1 pool to send the user the correct amount of funds to their L1 wallet. For BOBA, there are no delays for users to move funds from L1 to L2, and from L2 to L1.

Aside from normal users, the pools offer additional functionality to other parties. **Liquidity providers** (`stakers`) can deposit and withdraw funds from the pools; they earn rewards in proportion to their stake in the pool. Occasionally, they will withdraw their rewards via a dedicated function. 

Finally, the pools are controlled by an **admin** (`OnlyAdmin`) and/or the **Boba DAO** (OnlyDAO), which is able to set the fees users must pay to use the fast bridges. These fees are the source of the rewards for the liquidity providers.

## Reward Calculation and Updating

* A deposits 100

  **A info**

  | Deposit Amount | Reward       | Pending Reward |
  | -------------- | ------------ | -------------- |
  | 100            | 0            | 0              |

  **Pool info**

  | Total Rewards | Reward Per Share | Total Deposit Amount |
  | ------------- | ---------------- | -------------------- |
  | 0             | 0                | 100                  |

* The pool generates 10 rewards

  **Pool info**

  | Total Rewards | Reward Per Share | Total Deposit Amount |
  | ------------- | ---------------- | -------------------- |
  | 10            | 0                | 100                  |

* B deposits 100

  First, we update the rewardPerShare without considering the new deposit amount:

  **Pool info**

  | Total Rewards | Reward Per Share | Total Deposit Amount |
  | ------------- | ---------------- | -------------------- |
  | 10            | 10/100           | 100                  |

  Calculate B's information

  **B info**

  | Deposit Amount | Reward                                             | Pending Reward |
  | -------------- | -------------------------------------------------- | -------------- |
  | 100            | rewardPerShare * depositAmount = 10/100 * 100 = 10 | 0              |

  The total deposit amount of the pool is now 200.

  **Pool info**

  | Total Rewards | Reward Per Share | Total Deposit Amount |
  | ------------- | ---------------- | -------------------- |
  | 10            | 10/100           | 200                  |

* The pool generates another 5 rewards

  **Pool info**

  | Total Rewards | Reward Per Share | Total Deposit Amount |
  | ------------- | ---------------- | -------------------- |
  | 15            | 10/100           | 200                  |

* If A withdraws 100 tokens, we first update the rewardPerShare:

  **Pool info**

  | Total Rewards | Reward Per Share                                             | Total Deposit Amount |
  | ------------- | ------------------------------------------------------------ | -------------------- |
  | 15            | 10/100 + increased_rewards / total_deposit_amount = 10/100 + 5/200 | 200                  |

  The reward for A is

  ```
  deposit_amount * reward_per_share - reward = 100 * (10/100 + 5/200) - 0 = 12.5
  ```

* If B withdraws 100 tokens, we first update the rewardPerShare:

  **Pool info**

  | Total Rewards | Reward Per Share                                             | Total Deposit Amount |
  | ------------- | ------------------------------------------------------------ | -------------------- |
  | 15            | 10/100 + increased_rewards / total_deposit_amount = 10/100 + 5/200 | 200                  |

  The rewards for B is

  ```
  deposit_amount * reward_per_share - reward = 100 * (10/100 + 5/200) - 10 = 2.5
  ```

