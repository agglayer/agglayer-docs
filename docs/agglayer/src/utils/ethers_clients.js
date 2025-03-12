const { ethers } = require("ethers");
const config = require('../../config');

const providers = [
    new ethers.JsonRpcProvider(config.configuration[0].rpc),
    new ethers.JsonRpcProvider(config.configuration[1].rpc),
    new ethers.JsonRpcProvider(config.configuration[2].rpc),
];

module.exports = {
    providers,
}