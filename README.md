# Reward Courts

[I'm an inline-style link](https://reward.portonvictor.org/)

This is a project in progress. See also `TODO` file.

This is software for rewarding social good of all kinds, particularly managing and
selling carbon credits: https://gitcoin.co/issue/MPlus4Climate/MPlusToolKit/3/100023836

The idea is simple: Courts mint money to them who in any reason have too little (less than they should) money.
There is much too much injustice and poverty in this world, and we should do something
to solve this problem.

This first idea (mint money out of nothing, to distribute the burden of helping somebody to the entire society)
is not new, but it has the drawback that money
are decided by a centralized entity. That entity may lose reputation or fail badly.
Consider the Australian jurisdiction where the wheel is patented. The same could happen
with our crypto courts.

See https://github.com/vporton/carbon-flow/blob/main/README.md about child/parent relationships between courts
and (limits of) converting tokens between courts.

For more details, see [the wiki](https://github.com/vporton/courts/wiki).

# Kind of software

Reward Courts is several Ethereum smart contracts with a Web Aragon voting interface around them.
So each court usually makes decisions by voting.

## Tech stack

* NPM
* Buidler
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
