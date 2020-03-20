# Reward Courts
Courts That Perform Crypto Rewards Smart Contract

The idea is simple: Courts mint money to them who in any reason have too little (less than they should) money.
There is much too much injustice and poverty in this world, and we should do something
to solve this problem.

This first idea (mint money out of nothing, to distribute the burden of helping somebody to the entire society)
is not new, but it has the drawback that money
are decided by a centralized entity. That entity may lose reputation or fail badly.
Consider the Australian jurisdiction where the wheel is patented. The same could happen
with our crypto courts.

To solve this big drawback, it is proposed to be able to convert money from a currency of one court
to a currency of another court. Every token in our system consist of a court ID and
an _intercourt token_.

It is best explained with an example:

Consider the intercourt token HONEST of verifiable honestly earned money. Multiple courts (one entity is not
enough to check honesty of everybody in the world) may create their currencies like
HONEST1, HONEST2, ..., HONEST10. Then one would build a court H which would allow all these
HONEST1, HONEST2, ..., HONEST10 to be converted into its currency. This way we split the work
of verifying honesty into multiple organizations and have a "central" hub that based on their
decisions verifies honesty automatically.

Now a payment gateway may accept the money H of our hub, or it may choose to use another hub.
There is no really "central" hub, it is up to payment gateways and traders to decide which
money they accept and which don't. That's the democratic way to control money.

For more details, see [the wiki](https://github.com/vporton/courts/wiki).

This is a project in progress.

# Kind of software

Reward Courts is several Ethereum smart contracts with a Web Aragon voting interface around them.
So each court usually makes decisions by voting.

## Tech stack

* NPM
* Truffle
* Aragon
* IPFS
* React

# Installation

## Release mode

(Note: The release mode is not yet tested.)

TODO

## Debug mode

- Install Aragon CLI:

```
npm install @aragon/cli
```

- Deploy the software on your localhost:

```
npm start
```

After it starts, you will see the "Organization address" like `0x63536EE127797BC675659dCC760A59af073dAaB8`.
Run
```
./debug-setup.sh <address>
```

This script will create a core contract and a court associated with your organization.

After this you can mint test (not real) money on your machine.

# Tweaks

You may need the following tweaks:
```
sudo npm install --unsafe-perm=true  go-ipfs@0.4.22 --global
```
