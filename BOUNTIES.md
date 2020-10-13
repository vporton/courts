I suggest to create the following bounties:

- Review/test https://github.com/vporton/carbon-flow/tree/stable very thoroughly.

- Develop (linear or quadratic) voting with vote value being a function of the value
  donated during the vote. It is needed to use M+ token (and local tokens) as the voting
  token, because it is impossible to store the value of M+ at the start of a voting
  period (see https://github.com/vporton/carbon-flow/blob/main/README.md).
  Existing Aragon vote app is not appropriate - fork or modify it.

- Port Aragon to Fuse and then use GoodDollar Identity contract for anti-Sybil when
  quadratic voting.

- A script to easily install a carbon managing fund and other kinds of funds.
