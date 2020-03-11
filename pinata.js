const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const recursive = require('recursive-fs');
const basePathConverter = require('base-path-converter');

const pinDirectoryToIPFS = (pinataApiKey, pinataSecretApiKey, src) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    
    //we gather the files from a local directory in this example, but a valid readStream is all that's needed for each file in the directory.
    recursive.readdirr(src, function (err, dirs, files) {
        let data = new FormData();
        files.forEach((file) => {
            //for each file stream, we need to include the correct relative file path
            data.append(`file`, fs.createReadStream(file), {
                filepath: basePathConverter(src, file)
            })
        });
    
        const metadata = JSON.stringify({
            name: 'testname',
            keyvalues: {
                exampleKey: 'exampleValue'
            }
        });
        data.append('pinataMetadata', metadata);
    
        return axios.post(url,
            data,
            {
                maxContentLength: 'Infinity', //this is needed to prevent axios from erroring out with large directories
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey
                }
            }
        ).then(function (response) {
            console.log("IPFS hash:", response.data.IpfsHash)
        });
    });
};

module.exports = {
  pinDirectoryToIPFS: pinDirectoryToIPFS,
}
