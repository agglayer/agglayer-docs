const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    // instantiate a lxlyclient
    const client = await getLxLyClient();
    // source NetworkId is 0, since its Sepolia
    const sourceNetworkId = 0;
    // get an api instance of ether token on sepolia testnet
    const token = client.erc20(tokens[sourceNetworkId].ether, sourceNetworkId);
    // Set Destination Network as Cardona
    const destinationNetworkId = 1;
    // call the `bridgeAsset` api. Bridging 1 eth
    const result = await token.bridgeAsset("10000000000000000", to, destinationNetworkId);
  	// getting the transactionhash if rpc request is sent
    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
  	// getting the transaction receipt.
    const receipt = await result.getReceipt();
    console.log("receipt", receipt);
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});