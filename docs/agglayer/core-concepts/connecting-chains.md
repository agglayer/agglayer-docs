# Multi-stack Interop

## Overview
Currently, the Agglayer only supports integration with CDK chains, all of which share the same RPC node and sequencer software, CDK-Erigon. While CDK chains can be configured across a number of specifications, integration with the Agglayer requires only that the chain provide the inputs required to generate a pessimistic proof.

The path for integrating existing EVM chains and even non-EVM chains is primarily accomplished by generalizing the sub-components run automatically by CDK-Erigon. This is what allows other types of chains to safely provide the inputs required to generate a pessimistic proof.

---

## CDK Sovereign
There are three primary configurations for chains built with CDK: rollup, validium, and sovereign.  

CDK chains configured as sovereign are integrated with the Agglayer and do not use a ZK-EVM to generate state transitions. This setup is intended to provide early-stage projects with a **lightweight, low-cost execution environment** that still supports integration with a ZK prover.

Because CDK chains in this configuration do not use a ZK-EVM for state transitions, the safety of bridge deposits to Agglayer-connected chains is ensured by the pessimistic proof, which is built using a list of inputs which includes:  

- **Local Exit Tree**
- **Local Balance Tree**
- **Deposits and Withdrawals**

By generating a **valid pessimistic proof**, the Agglayer ensures that no chain may withdraw more tokens from the **unified bridge** than have been deposited into it.

---

## AggSender & AggOracle
AggSender and AggOracle are the sub-components of CDK that will allow existing EVM chains and non-EVM chains to connect to the Agglayer.

---

### AggSender
The **AggSender** sub-component is responsible for fetching the bridge deposits and bridge claims from a chain, which are then forged into a certificate that is sent to the Agglayer using the **interop_sendCertificate** API.

#### Agglayer certificate
The **AggSender** sub-component packages the information required to prove a chain’s bridge state into a **certificate**. This certificate provides the inputs needed to build a **pessimistic proof**. For more on this certificate, see:

- [Rust-defined](https://github.com/agglayer/agglayer/blob/75c844a1c3de64d422bb8681b34e1d5fa801ceb2/crates/agglayer-types/src/lib.rs#L194) Agglayer certificate
- [AggSender](https://github.com/0xPolygon/cdk/blob/faa2a749675c528ee77c96e56700aceb426a372e/aggsender/aggsender.go#L210) `buildCertificate` implementation

#### Certificate building
AggSender uses the following parameters to build a certificate:

1. The `l1Client` fetches L1 blocks. Because certificates are settled on the Agglayer in a single L1 epoch, which is configured by the `epochSize`, the AggSender needs to know how many L1 blocks have passed before sending another certificate.
2. The `l2Client` fetches the last block on the L2.
3. The `l2BridgeSyncer` fetches bridges, claims, and blocks** on the L2 needed for a certificate.
4. The `l1InfoTreeSyncer` builds inclusion proofs.
5. The Agglayer client sends certificates to the Agglayer and checks if previously sent certificates were settled on the Agglayer.

---

#### Storage
AggSender saves sent certificates in a local SQLite database. A table labeled `certificate_info` contains this data:

```sql
type CertificateInfo struct {
    Height           uint64                     `meddler:"height"`
    CertificateID    common.Hash                `meddler:"certificate_id"`
    NewLocalExitRoot common.Hash                `meddler:"new_local_exit_root"`
    FromBlock        uint64                     `meddler:"from_block"`
    ToBlock          uint64                     `meddler:"to_block"`
    Status           agglayer.CertificateStatus `meddler:"status"`
}
```
These parameters are defined as follows:

- `height`: A simple counter of the target chain’s certificates and is incremented by sending and settling certificates. <br>
- `certificateId`: The certificate’s hash.<br>
- `newLocalExitRoot`: The latest local exit root posted through the certificate and fetched from `l2BridgeSyncer`.<br>
- `fromBlock` and `toBlock`: Provide the range of blocks from which the Agglayer has received either tokens bridged to another chain or claims on another chain.<br>
- `status`: The certificate’s status on the Agglayer; it can be `pending`, `settled`, or `inError`

---

## AggOracle
While not currently ready for production, **AggOracle** functionally **injects the settled Agglayer state**, represented by the **Global Exit Root**, from L1.  

AggOracle provides part of the integration path required for **existing EVM chains** and **non-EVM chains** to connect to the Agglayer.  

### Function Calls
At a high level, the function calls used by AggOracle are as follows:

- **globalExitRootUpdater** is used to update the chain’s **Global Exit Root**.
- This address is configured via the setGlobalExitRootUpdater function on the deployed `GlobalExitRootManagerL2SovereignChain` contract.
- **AggOracle** will call the [insertGlobalExitRoot](https://github.com/0xPolygonHermez/zkevm-contracts/blob/feature/sovereign-bridge/contracts/v2/sovereignChains/GlobalExitRootManagerL2SovereignChain.sol#L69) function on the deployed `GlobalExitRootManagerL2SovereignChain` contract each time the **Global Exit Root** is updated on a finalized L1 block.

---

## Additional Requirements
Agglayer integration for existing EVM chains also requires deploying additional smart contracts.

| **Contract**                                      | **Deployed on** | **Function** |
|---------------------------------------------------|----------------|-------------|
| [BridgeL2SovereignChain.sol](https://github.com/0xPolygonHermez/zkevm-contracts/blob/v9.0.0-rc.5-pp/contracts/v2/sovereignChains/BridgeL2SovereignChain.sol)                 | L2             | Manages the token interactions with other Agglayer-connected chains; provides token remapping functionality. |
| [GlobalExitRootManagerL2SovereignChain.sol](https://github.com/0xPolygonHermez/zkevm-contracts/blob/v9.0.0-rc.5-pp/contracts/v2/sovereignChains/GlobalExitRootManagerL2SovereignChain.sol)  | L2             | Manages the exit roots of EVM Sovereign chains and settles Global Exit Roots. |

> **Note**: Existing EVM chains may need to take additional steps to integrate existing bridges or bridged assets into the Agglayer.
