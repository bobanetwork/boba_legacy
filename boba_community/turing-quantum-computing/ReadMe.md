# Smart contracts can now talk with Quantum computers

Yes you read right! With Turing (an oracle specific to the Boba.network) you can run computations on a **real quantum computer** and use the result in your smart contract within the same transaction (yes **NO callback**!).


## Use cases - Just why?
You may ask what is the actual use case for that? Well, I'm not a mathematician, but I'm sure they might get creative now or in the future.

On the other hand, what could possibly geekier/cooler than a smart contract on the Blockchain talking to real quantum computers?!

Nevertheless, here are some possible "use-cases":

- Get a REAL random number via the quantum computers specific nature (the Turing getRandom returns a really strong, but still pseudo-random number).
- Execute quantum computer algorithms, which would be not solvable on a normal computer or would simply take ages (Deutsch-Jozsa algorithm, Bernstein-Vazirani algorithm, ..).
- Further applications stated on the Qiskit-Website:
1. **Machine learning**: QSVM, VQC (Variational Quantum Classifier), and QGAN (Quantum Generative Adversarial Network) algorithms.
2. **Nature**: Quantum applications in chemistry, physics, and biology.
3. **Finance**: Uncertainty components for stock/securities problems, Ising translators for portfolio optimizations and data providers to source real or random data.
4. **Optimization**: High-level optimization problems that are ready to run on simulators and real quantum devices

## Get started
For the project to work we need 3, 4 things.

- Our custom smart contract (do whatever you want here)
- The TuringHelper contract (nothing to program, just to deploy -> used to pay for the offchain computation)
- AWS lambda with an API gateway to actually call the external API and prepare the result in a format the smart contract will understand.
- The external quantum computing API (e.g. the API key)

---

To make it as easy as possible we have built a so-called **SAM template** in the /aws folder.

Thus, when setting up your aws/sam cli locally, you could simply deploy the template and use the endpoint in your smart contract. For that you might want to run:

1. `yarn run aws:configure`
2. `yarn run sam:validate`
3. `yarn run sam:deploy`

