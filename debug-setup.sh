#!/bin/sh

DAO=$1

echo "Deploying core contract..."
# TODO: Use Perl for consistency
RewardCourts="$(npx aragon deploy RewardCourts | sed -n 's/.* at: \(.*\)/\1/'p)"
echo RewardCourts=$RewardCourts

echo "Deploying court names contract..."
# TODO: Use Perl for consistency
RewardCourtNames="$(npx aragon deploy RewardCourtNames --init $RewardCourts | sed -n 's/.* at: \(.*\)/\1/'p)"
echo RewardCourtNames=$RewardCourtNames

WRAPPER=$(npx dao apps $DAO | perl -n -e '/\b0xe75a5983d462123ad188959bc5a9fa088ef7705a4907445161ee12ea3a98e989.*?(0x[0-9a-fA-F]*)/ && print $1')
echo "Setting wrapper for this court..."
npx dao exec $DAO $WRAPPER setCourt $RewardCourts $RewardCourtNames 0
