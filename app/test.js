let web3js = require("web3")

let web3 = new web3js(new web3js.providers.HttpProvider('http://localhost:8545'));

console.log("VERSION", web3.version)
