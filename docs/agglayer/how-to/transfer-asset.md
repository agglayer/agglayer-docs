# Transfer any asset across Agglayer-connected chains 

This guide will help you get familiar with LxLy.js, configure your code to interact with Agglayer chains, and bridge assets from the Polygon zkEVM testnet to the Silicon Sepolia testnet using the Unified Bridge and lxly.js. <br><br>
In this guide you will: <br>
- Configure your environment <br>
- Bridge your asset using bridge API <br>
- Check its status using the Transaction API <br>
- Use the claim API to claim the transaction on the destination chain.
---

## Step 1: Set up your Environment (Prerequisites)

Before you begin, ensure that you have the following:

- **Node.js & npm:**
  - **Node.js:** v14.0.0 or later
  - **npm:** v6.0.0 or later
- **Hardhat Wallet:**  
  A Hardhat wallet (or similar) configured for testing.
- **Testnet ETH:**  
  Acquire test ETH (from a faucet) for the Sepolia testnet.

---

## Step 2: Configure your Environment

### 2.1 Update your `config.js` File

Make sure your `config.js` contains the correct network settings, RPC endpoints, bridge contract addresses, and account details. (See the [Template File](../src/config.js)  for a sample configuration.)

### 2.2 Set Up the Utility File: `utils_lxly.js`

This file initializes your connection with the Unified Bridge using lxly.js. It configures network providers (using HDWalletProvider or similar) for both the source and destination networks.

#### Example: `utils_lxly.js`
```javascript
const getLxLyClient = async (network = 'testnet') => {
  const lxLyClient = new LxLyClient();
  return await lxLyClient.init({
    log: true,
    network: network,
    providers: {
// zkEVM cardona 
       1: {
        provider: new HDWalletProvider([config.user1.privateKey], config.configuration[1].rpc),
        configuration: {
          bridgeAddress: config.configuration[1].bridgeAddress,
          bridgeExtensionAddress: config.configuration[1].bridgeExtensionAddress,
          isEIP1559Supported: false
        },
        defaultConfig: {
          from: config.user1.address
        }
      },
// silcion sepolia
      16: {
        provider: new HDWalletProvider([config.user1.privateKey], config.configuration[16].rpc),
        configuration: {
          bridgeAddress: config.configuration[16].bridgeAddress,
          bridgeExtensionAddress: config.configuration[16].bridgeExtensionAddress,
          isEIP1559Supported: false
        },
        defaultConfig: {
          from: config.user1.address
        }
      }
    }
  });
}
```

## Step 3: Bridge the Asset (`bridge_asset.js`)

In this step, you will initiate a cross-chain asset transfer from the Sepolia testnet to zkEVM (Agglayer).

**What Happens:**
- **BRIDGED State:**  
  When you call the `bridgeAsset` API, the transaction is initiated on the source chain.

**Script Walkthrough: `bridge_asset.js`**
```javascript
const { getLxLyClient, tokens } = require('./utils/utils_lxly');

const execute = async () => {
    // Initialize the lxly client
    const client = await getLxLyClient();

    // Define source network ID (zkEVM  Testnet)
    const sourceNetworkId = 1;
    // Get the API for the Ether token on the source network
    const token = client.erc20(tokens[sourceNetworkId].ether, sourceNetworkId);

    // Define destination network ID (Silicon sepolia)
    const destinationNetworkId = 16;
    // Bridge a specific amount of Ether (in wei)
    const result = await token.bridgeAsset("10000000000000000", config.user1.address, destinationNetworkId);

    // Log the transaction hash and receipt
    const txHash = await result.getTransactionHash();
    console.log("txHash", txHash);

    const receipt = await result.getReceipt();
    console.log("receipt", receipt);
}

execute()
  .then(() => {})
  .catch(err => {
    console.error("Error bridging asset:", err);
  })
  .finally(() => {
    process.exit(0);
  });
```
How to Run:
```bash
node bridge_asset.js
```


## Step 4: Check Transaction Status via the Transaction API

Before proceeding with claiming the asset, you need to verify its current status using the Transaction API. This step is typically performed using Postman or a cURL command.

### API Endpoints

- **Testnet:**
  ```bash
  https://api-gateway.polygon.technology/api/v3/transactions/testnet?userAddress={userAddress}
  ```
- **Mainnet:**
    ```bash
    https://api-gateway.polygon.technology/api/v3/transactions/mainnet?userAddress={userAddress}
    ```
    # Checking Transaction Status Using Postman

Using Postman, import the API endpoint to check the status of your transaction. This query will return details such as the token bridged, the amount, and the current state of the transaction.

## Step 5: Understand Transaction States

After querying the Bridge API, you will receive information on the transaction states. The key states are:

- **BRIDGED:**  
  The transaction has been initiated on the source chain (Sepolia) via the `bridgeAsset` API.

- **READY_TO_CLAIM:**  
  The asset is now available on the destination chain (zkEVM / AggLayer) and is awaiting claim.

- **CLAIMED:**  
  The asset has been successfully claimed on the destination chain after using the `claimAsset` API.

These states are verified by querying the API (for example, via Postman).

## Step 6: Claim the Bridged Asset (`claim_asset.js`)

Once the Bridge API shows that the asset is **READY_TO_CLAIM**, you can claim it on the destination chain using the claim API.

### What Happens:
- **CLAIMED State:**  
  The asset moves from a pending state to claimed after executing the claim.

### Script Walkthrough: `claim_asset.js`
```javascript
const { getLxLyClient, tokens } = require('./utils/utils_lxly');

const execute = async () => {
    // Replace with your actual bridge transaction hash from the bridge_asset.js output
    const bridgeTransactionHash = "0x1fc6858b20c75189a9fa8f3ae60c2a255cc3c41a058781f33daa57fc0f80b81a";
		
    // Initialize the lxly client
    const client = await getLxLyClient();
    
    // Define source network ID (zkEVM Testnet)
    const sourceNetworkId = 1;
    // Define destination network ID (Silicon sepolia)
    const destinationNetworkId = 16;
    // Get the API for the Ether token on the destination network
    const token = client.erc20(tokens[destinationNetworkId].ether, destinationNetworkId);
    
    // Claim the bridged asset using the claimAsset API
    const result = await token.claimAsset(bridgeTransactionHash, sourceNetworkId, { returnTransaction: false });
    console.log("Claim result:", result);
    
    // Log the transaction hash and receipt for the claim transaction
    const txHash = await result.getTransactionHash();
    console.log("Claim txHash:", txHash);
    
    const receipt = await result.getReceipt();
    console.log("Claim receipt:", receipt);
}

execute()
  .then(() => {})
  .catch(err => {
    console.error("Error claiming asset:", err);
  });
```
How to run:
```bash
node claim_asset.js
```

## Step 7: Confirm the Final Transaction Status

After claiming the asset, verify the final state using the Bridge API:
Use Postman or a cURL command to ensure that the transaction state has been updated to **CLAIMED**.