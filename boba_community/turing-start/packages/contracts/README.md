## @turing/contracts

A minimalist, opinionated structure for managing smart contract ABIs and addresses.

[Read more about Application Binary Interfaces (ABIs) here](https://ethereum.stackexchange.com/questions/234/what-is-an-abi-and-why-is-it-needed-to-interact-with-contracts).


### Build typings for your ABIs
Run `yarn run typechain:generate` and use it in your project like this:

```ts
import {TuringMonsters} from "@turing/contracts/gen/types";

// Typed contract
const contract = new Contract(addresses.turingMonstersMainnet, abis.turingMonsters) as TuringMonsters;
```
