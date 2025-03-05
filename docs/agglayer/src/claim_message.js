const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    const client = await getLxLyClient();
    // bridge txn hash from the source chain.
    const bridgeTransactionHash = "0xfe25c1d884a7044ba18f6cee886a09a8e94f9ae12c08fd5d94cdc6f430376bf2"; 
    // Network should be set as 1 since its from cardona.
    const sourceNetworkId = 1;
    // Network should be set as 0 since its to sepolia
    const destinationNetworkId = 0;
    // API for building payload for claim
    const result = 
        await client.bridgeUtil.buildPayloadForClaim(bridgeTransactionHash, sourceNetworkId)
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

    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);
    const receipt = await result.getReceipt();
    console.log("receipt", receipt);
}

execute().then(() => {
}).catch(err => {
    console.error("err", err);
}).finally(_ => {
    process.exit(0);
});