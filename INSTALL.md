Free tech support for installing the Reward Courts is currently provided by
Victor Porton <porton@narod.ru>.

First the developer (not you, skip this step) executes the command:
```
aragon apm publish major --environment rinkeby --files dist/
```

The below assumes you install on `rinkeby` test network. If you want to install
on the real mainnet, replace `rinkeby` everywhere below by `mainnet`.

The installation order:

* Create an organization on aragon.org (probably the most appropriate organization type for
a court is "Membership") and assign organization members.

* Assign to somebody with Aragon command line the permission to manage apps.
(See System / Permissions / System Permissions).

* Execute by this user:
```
dao install <ORG NAME> reward.open.aragonpm.eth --environment rinkeby
```

* Execute the following to find the new app <PROXY ADDRESS>:
```
npx dao apps testrewardcourt4 --all --env rinkeby
```

* Execute:
```
dao acl create <ORG ADDRESS> <PROXY ADDRESS> JUDGE_ROLE 0xf2b29300165ecfea297aa5fd2c2b5c62f19b08ff 0xf2b29300165ecfea297aa5fd2c2b5c62f19b08ff --env rinkeby
```

* Vote for this permission.

* Remove Manage Apps permission

* Set owned contract and names contracts ("Manage" tab).

On Rinkeby these contracts are the following:

owned: 0x2bd4D216803883136b882643Df1048247695F2bC
names: 0xdc978C0928a69742Ef629E39a4f7eecbD0300539
