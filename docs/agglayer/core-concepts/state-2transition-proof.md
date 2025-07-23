# State Transition Proof

## Overview

The State Transition Proof is Agglayer's trust validation process that ensures the security and validity of cross-chain operations. It works as a comprehensive verification system with two layers: internal state transition verification and cross-chain verification.

## Two-Layer Verification Model

### 1. State Transition Proof (Validity Proof)

This layer verifies that each chain's internal state transitions are valid. It ensures that all transactions within a chain are properly executed and the chain's state is consistent. This is implemented through:

* **Validity Proof**: A detailed verification of every operation in the chain using zero-knowledge proofs
* **ECDSA Signature**: A simpler verification method where a trusted sequencer signs off on state changes

### 2. Cross-Chain Verification (Aggchain Proof & Pessimistic Proof)

This layer verifies that cross-chain operations (like asset transfers between chains) are valid. It ensures that when assets move between chains, the operations are atomic and secure through:

* **Aggchain Proof**: Confirms the chain's view of bridge I/O and verifies bridge constraints
* **Pessimistic Proof**: Double-checks aggregate deposit and withdrawal balances

## Verification Methods

### ECDSA Verification

The ECDSA implementation uses a trusted sequencer that signs off on state changes to ensure they are valid. When a chain wants to update its state or perform cross-chain operations, the trusted sequencer must verify and sign these changes using their private key.

```rust
// ECDSA Verification Code
pub fn verify(
    &self,
    l1_info_root: Digest,
    new_local_exit_root: Digest,
    commit_imported_bridge_exits: Digest,
) -> Result<(), ProofError> {
    let sha256_fep_public_values = self.sha256_public_values();
    let signature_commitment = keccak256_combine([
        sha256_fep_public_values,
        new_local_exit_root.0,
        commit_imported_bridge_exits.0,
    ]);

    let recovered_signer = signature
        .recover_address_from_prehash(&B256::new(signature_commitment.0))
        .map_err(|_| ProofError::InvalidSignature)?;

    if recovered_signer != self.trusted_sequencer {
        return Err(ProofError::InvalidSigner {
            declared: self.trusted_sequencer,
            recovered: recovered_signer,
        });
    }

    Ok(())
}
```

### Validity Proof Verification

The Validity Proof (Full execution proof, aka `fep`) provides comprehensive verification of chain operations, used in `cdk-op-geth`. It verifies every aspect of a chain's state transition and bridge constraints.

```rust
// Validity Proof Verification Code
pub fn verify( 
    &self,
    l1_info_root: Digest,
    new_local_exit_root: Digest,
    commit_imported_bridge_exits: Digest,
) -> Result<(), ProofError> {
    // Verify l1 head
    self.verify_l1_head(l1_info_root)?;

    // Verify the FEP stark proof
    sp1_zkvm::lib::verify::verify_sp1_proof(
        &self.aggregation_vkey_hash.to_hash_u32(),
        &self.sha256_public_values().into(),
    );

    Ok(())
}
```

## Aggchain Proof

Aggchain Proof is a flexible verification system that supports different types of consensus mechanisms for proving chain state transitions. It combines internal chain verification with bridge verification to ensure both operations are secure.

### Data Structure

```rust
pub struct AggchainProofWitness {
    /// Previous local exit root
    pub prev_local_exit_root: Digest,
    /// New local exit root
    pub new_local_exit_root: Digest,
    /// L1 info root used to import bridge exits
    pub l1_info_root: Digest,
    /// Origin network for which the proof was generated
    pub origin_network: u32,
    /// Full execution proof with its metadata
    pub fep: FepInputs,
    /// Commitment on the imported bridge exits minus the unset ones
    pub commit_imported_bridge_exits: Digest,
    /// Bridge witness related data
    pub bridge_witness: BridgeWitness,
}
```

### Execution Process

1. **Verify Internal Proof**: First verifies the local chain's ECDSA signature or Validity Proof
2. **Verify Bridge Constraints**: Then verifies the bridge constraints including:
   * GER insert/remove stack verification
   * Claimed and unset hashchains verification
   * Local Exit Root verification
   * Bridge exits commitment verification
   * GER inclusion in L1 Info Root verification

## How It Works

The State Transition Proof process follows three main steps:

1. **Step 1: Internal Verification**
   * Chain generates validity proof or ECDSA signature of state transition
   * This happens inside a zkVM (currently SP1 zkVM)

2. **Step 2: Aggchain Proof**
   * AggProver verifies the internal proof and bridge constraints
   * Generates a proof of the entire verification process
   * Returns `AggchainProofPublicValues`

3. **Step 3: Pessimistic Proof**
   * Agglayer verifies the Aggchain Proof
   * Verifies Local Exit Tree, Local Balance Tree, and Nullifier Tree changes
   * Accepts the Local Chain State Transition Certificate

!!! note
    A state root is accepted only when both internal state transition verification and cross-chain verification succeed. This dual-layer approach ensures that Agglayer can maintain security while supporting different types of chains with varying consensus mechanisms.
