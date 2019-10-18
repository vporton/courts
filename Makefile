.PHONY: all clean

all: truffle

.PHONY: truffle
truffle:
	truffle compile

generated/court.dat: truffle build/contracts/court.json
	python3 -c 'import sys, json; i = open("$<"); sys.stdout.write(json.load(i)["bytecode"])' > $@

clean:
# 	rm -f generated/*.dat
	rm -rf build
