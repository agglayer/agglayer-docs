# How to Transfer an Asset and Call a Contract from Agglayer-Connected Chains

This tutorial demonstrates how to perform a combined operation that bridges an asset and calls a contract across Agglayer-connected chains using **lxly.js**. In this example, you will:

- Deploy a Solidity smart contract that can receive an asset and execute a function call.
- Use **lxly.js** to bridge an asset (ETH) and simultaneously call a function on the deployed contract.
- Claim the bridged asset and the associated message on the destination chain.

For this tutorial, we assume the following network configuration:

- **Source Chain:** Cardona (network ID: 1)
- **Destination Chain:** Sepolia (network ID: 0)
- **Asset:** ETH (represented using the zero address)
- **Smart Contract Function:** A function that receives ETH (via `msg.value`) and processes the call (e.g. updating counters)

Make sure you have Node.js installed and your project set up with the necessary dependencies (such as **lxly.js**, your network configuration in `./utils/utils_lxly`, and the proper ABIs).

---

## Step 1. Deploy the Smart Contract

Create a Solidity file named `AssetAndCallReceiver.sol` with the following code. This contract contains the `processTransferAndCall` function which receives ETH (ensuring that the sent value matches the specified asset amount) and updates its state accordingly.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AssetAndCallReceiver {
    uint256 public totalTransferred;
    uint256 public callCounter;
    
    event AssetReceived(address indexed sender, uint256 amount);
    event CallExecuted(
        address indexed caller,
        uint256 assetAmount,
        uint256 totalTransferred,
        uint256 callCounter
    );

    // This function receives an asset (ETH) and processes a call.
    // The sent ETH (msg.value) must match the specified assetAmount.
    function processTransferAndCall(uint256 assetAmount) external payable {
        require(msg.value == assetAmount, "Asset amount mismatch");

        totalTransferred += assetAmount;
        callCounter++;

        emit AssetReceived(msg.sender, assetAmount);
        emit CallExecuted(msg.sender, assetAmount, totalTransferred, callCounter);
    }
}
```
# Deployment

Deploy the `AssetAndCallReceiver` contract on your destination chain (Sepolia). Make a note of the deployed contract’s address; you will need it in Step 2.

---

## Step 2. Bridge an Asset and Call the Contract

Create a JavaScript file named `bridge_and_call_asset.js`. This script uses **lxly.js** to bridge an asset (for example, 0.01 ETH) from the source chain (Cardona) to the destination chain (Sepolia) while simultaneously calling the `processTransferAndCall` function on the deployed contract.

```javascript
const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');
const { AssetAndCallReceiverABI } = require("../../ABIs/AssetAndCallReceiver");

const execute = async () => {
    // Initialize the Agglayer client.
    const client = await getLxLyClient();

    // Set the token to the zero address (native ETH).
    const token = "0x0000000000000000000000000000000000000000";

    // Define the asset amount to be transferred.
    // In this example, 0.01 ETH = 10^16 wei = 0x2386F26FC10000 (in hexadecimal).
    const amount = "0x2386F26FC10000";

    // Define the source and destination networks.
    // Source: Cardona (network ID: 1)
    // Destination: Sepolia (network ID: 0)
    const sourceNetwork = 1;
    const destinationNetwork = 0;

    // Replace the value below with your deployed AssetAndCallReceiver contract address on Sepolia.
    const callAddress = "0xYourDeployedAssetAndCallReceiverAddress";

    // Set the fallback address (usually the sender's address) in case the call fails.
    const fallbackAddress = from;

    // Flag to update the global exit root (set to true if required by your deployment).
    const forceUpdateGlobalExitRoot = true;

    // Create an instance of the AssetAndCallReceiver contract.
    const callContract = client.contract(AssetAndCallReceiverABI, callAddress, destinationNetwork);

    // Prepare the call data by encoding the processTransferAndCall function with the asset amount.
    const callData = await callContract.encodeAbi("processTransferAndCall", amount);

    let result;
    // Call the bridgeAndCall API; include an optional permitData parameter for testnet if needed.
    if (client.client.network === "testnet") {
        console.log("Running on testnet");
        result = await client.bridgeExtensions[sourceNetwork].bridgeAndCall(
            token,
            amount,
            destinationNetwork,
            callAddress,
            fallbackAddress,
            callData,
            forceUpdateGlobalExitRoot,
            "0x0" // Optional permitData parameter.
        );
    } else {
        console.log("Running on mainnet");
        result = await client.bridgeExtensions[sourceNetwork].bridgeAndCall(
            token,
            amount,
            destinationNetwork,
            callAddress,
            fallbackAddress,
            callData,
            forceUpdateGlobalExitRoot
        );
    }

    console.log("Bridge and Call Asset Result:", result);

    // Retrieve and log the transaction hash.
    const txHash = await result.getTransactionHash();
    console.log("Transaction Hash:", txHash);

    // Retrieve and log the transaction receipt.
    const receipt = await result.getReceipt();
    console.log("Transaction Receipt:", receipt);
};

execute()
    .then(() => { /* Execution succeeded */ })
    .catch(err => {
        console.error("Error occurred:", err);
    })
    .finally(() => {
        process.exit(0);
    });
```

## Step 3. Claim the Bridged Asset and Message

After the bridging operation is complete and the global exit root is updated on the destination chain, you need to claim the bridged asset and the associated contract call message.
Create a JavaScript file named claim_asset_and_message.js with the following code:
```javascript
const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    // Initialize the Agglayer client.
    const client = await getLxLyClient();

    // Use the bridge transaction hash from the bridgeAndCall operation.
    // Replace the value below with your actual bridge transaction hash.
    const bridgeTransactionHash = "0xYourBridgeTransactionHash"; 

    // Define the source and destination network IDs.
    // Source: Cardona (network ID: 1)
    // Destination: Sepolia (network ID: 0)
    const sourceNetworkId = 1;
    const destinationNetworkId = 0;

    // Get an API instance of the ETH token on the destination chain (Sepolia).
    const token = client.erc20(tokens[destinationNetworkId].ether, destinationNetworkId);

    // Claim the asset using the claimAsset API.
    const resultToken = await token.claimAsset(bridgeTransactionHash, sourceNetworkId, { returnTransaction: false });
    console.log("Asset Claim Result:", resultToken);

    // Retrieve and log the asset claim transaction hash.
    const txHashToken = await resultToken.getTransactionHash();
    console.log("Asset Claim Transaction Hash:", txHashToken);

    // Retrieve and log the asset claim receipt.
    const receiptToken = await resultToken.getReceipt();
    console.log("Asset Claim Receipt:", receiptToken);

    // Build the payload required for claiming the bridged message.
    const resultMessage = await client.bridgeUtil.buildPayloadForClaim(bridgeTransactionHash, sourceNetworkId, 1)
        .then((payload) => {
            console.log("Payload for Claim:", payload);
            // Use the payload to call the claimMessage API.
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
    console.log("Message Claim Result:", resultMessage);

    // Retrieve and log the message claim transaction hash.
    const txHashMessage = await resultMessage.getTransactionHash();
    console.log("Message Claim Transaction Hash:", txHashMessage);

    // Retrieve and log the message claim receipt.
    const receiptMessage = await resultMessage.getReceipt();
    console.log("Message Claim Receipt:", receiptMessage);
};

execute()
    .then(() => { /* Execution succeeded */ })
    .catch(err => {
        console.error("Error occurred:", err);
    })
    .finally(() => {
        process.exit(0);
    });
```
## Conclusion

In this tutorial, you learned how to combine asset transfer and contract invocation across Agglayer-connected chains by:

1. **Deploying a smart contract (`AssetAndCallReceiver`)** that can receive ETH and execute logic.
2. **Bridging an asset and calling the contract simultaneously** using the `bridgeAndCall` API.
3. **Claiming the bridged asset and message** on the destination chain using `claimAsset` and `claimMessage`.

This integrated approach allows you to move assets and trigger contract functionality seamlessly between different networks.
