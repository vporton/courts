The installation order (not tested):

aragon apm publish major --environment rinkeby --files dist/

* Create an organization.

* Assign to somebody the permission to manage app.

* dao install <ORG NAME> reward.open.aragonpm.eth --environment rinkeby

* npx dao apps testrewardcourt4 --all --env rinkeby

# dao acl create <ORG ADDRESS> <PROXY ADDRESS> JUDGE_ROLE 0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 --env rinkeby
* dao acl create <ORG ADDRESS> <PROXY ADDRESS> JUDGE_ROLE 0xf2b29300165ecfea297aa5fd2c2b5c62f19b08ff 0xf2b29300165ecfea297aa5fd2c2b5c62f19b08ff --env rinkeby

* Vote for this permission.

* Remove Manage Apps permission
