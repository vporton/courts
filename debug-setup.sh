#!/bin/sh

DAO=$1

# TODO: Use Perl for consistency
RewardCourts="$(npx aragon deploy RewardCourts | sed -n 's/.* at: \(.*\)/\1/'p)"

WRAPPER=$(dao apps $DAO | perl -n -e '/\breward.open@.*?(0x[0-9a-fA-F]*)/ && print $1')
