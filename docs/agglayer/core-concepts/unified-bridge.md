# Unified Bridge
## Overview
The unified bridge (prev. LxLy bridge) is the common access point for chains connected to the Agglayer. Along with the pessimistic proof, it is one of two core components of the Agglayer.

The unified bridge consists of two main components: The **on-chain smart contracts** for maintaining the data structures related to chain states, cross-chain transactions, and the Agglayer’s Global Exit Root, and the **off-chain services & tooling** for interacting with it.

## Bridge Smart Contracts
The unified bridge is responsible for maintaining the data structures related to chain states, cross-chain transactions, and the Agglayer’s Global Exit Root, ensuring cross-chain transactions are finalized on the L1 before they can be claimed. The smart contracts are as follows:

| **Contract**                                      | **Deployed on** | **Function** |
|---------------------------------------------------|----------------|-------------|
| `PolygonRollupManager.sol`                 | L1             | Responsible for creating, updating, and verifying rollups, validiums, and sovereign chains built with Polygon CDK |
| `PolygonZkEVMBridgeV2.sol`  | L1 & L2             | Responsible for bridging and claiming assets or messages across L1 and L2 chains |
| `PolygonZkEVMGlobalExitRootV2.sol` | L1 & L2 | Maintains the Global Exit Root, which represents the complete state of all exit data from chains connected through the Agglayer


## Function Calls
`PolygonZkEVMBridgeV2.sol` defines the primary function calls for cross-chain bridging through the Agglayer.

| **Function Name** | **Description** |
|-----------------|------------------|
| bridgeAsset | Bridges assets and locks tokens on the source chain
| bridgeMessage | Initiates a bridge transaction from the source chain
| claimMessage | Verifies the Merkle proof and executes the received message on the destination chain
| bridgeMessageWETH | Facilitates the cross-chain transfer of WETH
| claimAsset | Facilitates the claiming of bridged assets on the destination network after a successful bridge operation


## Data Structures
### Local Exit Root & Local Index
All cross-chain transactions using the unified bridge are recorded in a **Sparse Merkle Tree** called the **Local Exit Tree**. Each Agglayer-connected chain updates its own **Local Exit Tree**, maintained in `PolygonZkEVMBridgeV2.sol` on the L2. The **Local Exit Root** is the root of the Local Exit Tree, a binary tree with a height of 32, updated each time a new cross-chain transaction is initiated. **Local Root Index** is the index of the leaf node, which is a hash of cross-chain transactions such as `bridgeAsset / bridgeMessage`.

### Rollup Exit Root
Once a chain updates its **Local Exit Tree** in `PolygonRollupManager.sol`, the contract updates the chain’s **Local Exit Root**. Each time a chain’s Local Exit Root is updated, the **Rollup Exit Root** is also updated.The **Rollup Exit Root** is the Merkle root of all Local Exit Roots.

Any update to the Rollup Exit Root triggers an update of the **Global Exit Root**, which is maintained in `PolygonZkEVMGlobalExitRootV2.sol` on the L1.

### Mainnet Exit Root
Functionally similar to the **Local Exit Root**, but it tracks the bridging activities of L1 to all chains connected through the Agglayer. When the **Mainnet Exit Root** is updated in `PolygonZkEVMBridgeV2.sol`, the contract then updates `mainnetExitRoot` in `PolygonZkEVMGlobalExitRootV2.sol`.

### Global Exit Root, L1 Info Tree, Global Index
**Global Exit Root** is the hash of the Rollup Exit Root and Mainnet Exit Root. When a new Rollup Exit Root or Mainnet Exit Root is submitted, the contract appends the new **Global Exit Root** to the **L1 Info Tree**. 

**L1 Info Tree** is a Sparse Merkle Tree that maintains timestamps and L1 block hashes. It is a binary tree with a height of 32, updated every time a new Global Exit Root is submitted. **Global Index** is a 256-bit string used to locate the unique leaf in the latest **Global Exit Tree** when creating and verifying SMT proofs.
