This directory contains a stress tester utility for use on local or Testnet
deployments. It is presently intended to be run directly, not from within a
docker container. It depends on "web3.py" which may be installed using 'pip'.

To run: python ./stress_tester.py <target> <num_children>

<target>, e.g. "local", refers to a configuration in targets/<target>.json

For Rinkeby you will need to provide an Infura API key (don't check into git).

At the start of a test, a specified number of child accounts are created and
funded. Each child will randomly perform one of the available options, such
as a fast exit or a payment to another L2 account. The child will wait for
its operation to succeed and will then proceed to a new operation, repeating
until it runs out of funds or an error occurs.

To stop a test, press ctrl-C once. This will initiate a clean shutdown,
waiting for each child to finish its current operation and then attempting
to refund any remaining balances to the initial funding account. If an
operation is stuck, pressing ctrl-C a second time will print some additional
statistics and then move to the next phase of shutdown. A third ctrl-C will
kill the process immediately. 

There are two watcher threads which monitor new blocks on the L1 and L2
chains, detecting transaction receipts and events for pending operations.
There is also a mainloop thread which periodically reports statistics such
as the available balances in the liquidity pools.

Various logs are written to the "logs/" subdirectory, including "op.log"
which contains entries for each operation. There is an OP_START when a child
begins to execute the operation, an OP_WATCH with a transaction ID once it
has submitted its transaction, and an OP_DONE with a final result.

Example:
  OP_START,000,FX,2,1635364366.14432049
  OP_WATCH,000,FX,1,00000.66221166,0x6f22690c03cde6159bc60ffa35450fbcb6de0ff01b7f76558be041b88aced3b4
  OP_DONE_,000,FX,1,1,119515/120849,00000.66221166,00003.66329575,00262.85288596

Child 000 performs a fast exit (FX) starting at timestamp 1635364366.14432049
The field after the FX opcode is the chain ID. The next OP_WATCH field is the
time interval since the OP_START timestamp, followed by a transaction ID.
The OP_DONE field after the chainID is a success/failure flag. Next is the
amount of gas used / amount of gas estimated. The following fields are time
intervals for each phase of the operation. The final field is the overall
time taken from start to finish.

The logs directory also contains an "accounts-<target>" file containing the
account ID and private key of each child process. This can be used by another
utility to recover lost funds from test runs which did not shut down cleanly.

====

Web3.py installation instructions:

# From https://web3py.readthedocs.io/en/stable/troubleshooting.html#setup-environment
#
#$ which pip || curl https://bootstrap.pypa.io/get-pip.py | python
#
## Install virtualenv if it is not available:
#$ which virtualenv || pip install --upgrade virtualenv
#
## *If* the above command displays an error, you can try installing as root:
#$ sudo pip install virtualenv
#
## Create a virtual environment:
#$ virtualenv -p python3 ~/.venv-py3
#
## Activate your new virtual environment:
#$ source ~/.venv-py3/bin/activate
#
## With virtualenv active, make sure you have the latest packaging tools
#$ pip install --upgrade pip setuptools
#
## Now we can install web3.py...
#$ pip install --upgrade web3

After initial installation, you will need to run the
"source ~/.venv-py3/bin/activate" command again in each new shell session.
