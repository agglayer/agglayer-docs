const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    // bridge txn hash from the source chain.
    const bridgeTransactionHash = "0x7f1f06f24b3be354776bd351c11dd64f77e3429fb70a75bac3437a29eb6bbe9a"; 
    // Network should be set as 1 since its from cardona.
    const sourceNetworkId = 1;
    // Network should be set as 0 since its to sepolia
    const destinationNetworkId = 0;
    // get an api instance of ether token on cardona testnet
    const token = client.erc20(tokens[destinationNetworkId].ether, destinationNetworkId);
    // call the `claimAsset` api.
    const resultToken = await token.claimAsset(bridgeTransactionHash, sourceNetworkId, {returnTransaction: false});
    console.log("resultToken", resultToken);
  	// getting the transactionhash if rpc request is sent
    const txHashToken = await resultToken.getTransactionHash();
    console.log("txHashToken", txHashToken);
  	// getting the transaction receipt.
    const receiptToken = await resultToken.getReceipt();
    console.log("receiptToken", receiptToken);
    // API for building payload for claim
    const resultMessage = 
        await client.bridgeUtil.buildPayloadForClaim(bridgeTransactionHash, sourceNetworkId, bridgeIndex=1)
        // payload is then passed to `claimMessage` API
        .then((payload) => {
            console.log("payload", payload);
            return client.bridges[destinationNetworkId].claimMessage(
                payload.smtProof,
                payload.smtProofRollup,
                BigInt(payload.globalIndex),
                payload.mainnetExitRoot,
                payload.rollupExitRoot,
                payload.originNetwork,
                payload.originTokenAddress,
                payload.destinationNetwork,
                payload.destinationAddress,
                payload.amount,
                payload.metadata
            );
        });
    console.log("resultMessage", resultMessage);

    const txHashMessage = await resultMessage.getTransactionHash();
    console.log("txHashMessage", txHashMessage);
    const receiptMessage = await resultMessage.getReceipt();
    console.log("receipt", receiptMessage);
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});