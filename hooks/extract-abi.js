"use strict"

const fs = require('fs');

function extractABI(contractFile, outputFile) {
  fs.readFile(contractFile, function(err, content) {
    fs.writeFile(outputFile, JSON.stringify(JSON.parse(content).abi),
      err => {
        if (err) throw err
      })
  })
}

const dir = process.argv[2]
const fileNames = ['RewardCourts.json', 'RewardCourtNames.json']
for (var i in fileNames) {
  const fileName = fileNames[i];
  extractABI("build/contracts/" + fileName, dir + "/" + fileName)
}
