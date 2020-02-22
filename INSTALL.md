The installation order (not tested):

aragon apm publish major --environment rinkeby --files dist/

* Create an organization.

* Assign to somebody the permission to manage app.

* dao install <ORG NAME> reward2.open.aragonpm.eth --environment rinkeby

-----------

* dao acl create <ORG ADDRESS> <PROXY ADDRESS> JUDGE_ROLE 0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 0xb4124cEB3451635DAcedd11767f004d8a28c6eE7 --env rinkeby
