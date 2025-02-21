# BridgeAndCall-Quickstart-guide

# How to Call Any Contract on the Agglayer Using lxly.js

This guide shows you how to bridge a contract call from one Layer 2 (L2) network (Cardona) to another (Silicon Sepolia) using the **lxly.js** library. We will cover:

- **Part 1:** Bridge and Call from the Source L2  
- **Part 2:** Claim Asset & Claim Message on the Destination L2


## Overview

The agglayer bridging solution allows you to invoke a contract on a destination chain by "bridging" a transaction from a source chain. In this tutorial, you'll:

1. **Deploy a sample contract** (`Counter.sol`) on Silicon Sepolia.
2. **Initiate a bridgeAndCall operation** from Cardona to Silicon Sepolia.
3. **Claim the bridged asset and message** on the destination chain after the global exit root is updated.

---

## Prerequisites

- **Node.js:** Install from [nodejs.org](https://nodejs.org/).
- **Contract Deployment Tools:** Use Hardhat or Remix to deploy contracts.
- **lxly.js and ABIs:** Ensure you have access to `lxly.js` and the ABI for your target contract.
- **Test Networks:** Access to Cardona (source) and Silicon Sepolia (destination).

---


## Step 1 – Deploy the Contract on the Destination Network

Create a simple contract named `Counter.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;

    function increment(uint256 _value) public {
        count += _value;
    }
}
```

## Step 2 - Bridge and Call Script

Create a file named `bridge_and_call.js` with the following code:

```javascript
const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');
const { CounterABI } = require("../../ABIs/Counter");

const execute = async () => {
    // Initialize the LxLy client for interacting with the agglayer.
    const client = await getLxLyClient();

    // Set the token address to the zero address for ETH (native asset)
    const token = "0x0000000000000000000000000000000000000000";
    // No token amount is being bridged in this example.
    const amount = "0x0";

    // Define the source (Cardona) and destination (Silicon Sepolia) network IDs.
    const sourceNetwork = 1; 
    const destinationNetwork = 16;

    // Use the deployed Counter contract’s address on the destination network.
    const callAddress = "0x43854F7B2a37fA13182BBEA76E50FC8e3D298CF1";
    
    // Fallback address in case the call fails.
    const fallbackAddress = from;
    
    // If true, the global exit root will be updated.
    const forceUpdateGlobalExitRoot = true;

    // Create an instance of the contract using its ABI and destination address.
    const callContract = client.contract(CounterABI, callAddress, destinationNetwork);

    // Prepare the call data: encode the `increment` function with a parameter (e.g., "0x4").
    const callData = await callContract.encodeAbi("increment", "0x4");  
    
    let result;
    // Use different parameters for testnet versus mainnet (here we include optional permitData on testnet)
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

    console.log("Bridge and Call Result:", result);

    // Retrieve and log the transaction hash.
    const txHash = await result.getTransactionHash();
    console.log("Transaction Hash:", txHash);

    // Retrieve and log the transaction receipt.
    const receipt = await result.getReceipt();
    console.log("Transaction Receipt:", receipt); 
}

execute()
    .then(() => { /* Successful execution */ })
    .catch(err => {
        console.error("Error occurred:", err);
    })
    .finally(_ => {
        process.exit(0);
    });
```

### Run command -
```bash
node bridge_and_call.js
```

## Key Points

- **Networks:**  
  - `sourceNetwork` is set to `1` (representing Cardona).  
  - `destinationNetwork` is set to `16` (representing Silicon Sepolia).

- **Bridge Operation:**  
  The `bridgeAndCall` function is called on the client's bridge extension to execute a contract call on the destination chain after bridging.

## Step 3 -  Claim Asset and Claim Message on the Destination L2

Once the Global Exit Root is updated on Silicon Sepolia, claim both the asset (if any) and the message that triggered the contract call.
Create a file named claim_bridge_and_call.js with the following code:
```javascript const { getLxLyClient, tokens, configuration, from, to } = require('./utils/utils_lxly');

const execute = async () => {
    // Initialize the client.
    const client = await getLxLyClient();

    // Provide the bridge transaction hash from the source chain (Cardona).
    const bridgeTransactionHash = "0x7f1f06f24b3be354776bd351c11dd64f77e3429fb70a75bac3437a29eb6bbe9a"; 
    const sourceNetworkId = 1;      // Source network (Cardona).
    const destinationNetworkId = 16; // Destination network (Silicon Sepolia).

    // Get an ERC20 token instance for ETH on the destination network.
    const token = client.erc20(tokens[destinationNetworkId].ether, destinationNetworkId);

    // Claim the asset using the bridge transaction hash.
    const resultToken = await token.claimAsset(bridgeTransactionHash, sourceNetworkId, { returnTransaction: false });
    console.log("Asset Claim Result:", resultToken);

    // Log the asset claim transaction hash.
    const txHashToken = await resultToken.getTransactionHash();
    console.log("Asset Claim Transaction Hash:", txHashToken);

    // Log the asset claim receipt.
    const receiptToken = await resultToken.getReceipt();
    console.log("Asset Claim Receipt:", receiptToken);

    // Build the payload needed for claiming the bridged message.
    const resultMessage = await client.bridgeUtil.buildPayloadForClaim(bridgeTransactionHash, sourceNetworkId, 1) // bridgeIndex = 1
        .then((payload) => {
            console.log("Payload for Claim:", payload);
            // Use the payload data to claim the message.
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

    // Log the message claim transaction hash.
    const txHashMessage = await resultMessage.getTransactionHash();
    console.log("Message Claim Transaction Hash:", txHashMessage);

    // Log the message claim receipt.
    const receiptMessage = await resultMessage.getReceipt();
    console.log("Message Claim Receipt:", receiptMessage);
}

execute()
    .then(() => { /* Successful execution */ })
    .catch(err => {
        console.error("Error occurred:", err);
    })
    .finally(_ => {
        process.exit(0);
    });
```

Run command :
```bash
node claim_bridge_and_call.js
```
