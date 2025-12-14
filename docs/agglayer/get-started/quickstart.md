---josephstudios7
title: Quickstart
---

<!-- Page Header Component -->
<h1 style="text-align: left; font-size: 38px; font-weight: 700; font-family: 'Inter Tight', sans-serif;">
  Quickstart
</h1>

<div style="text-align: left; margin: 2rem 0;">
  <p style="font-size: 18px; color: #666; max-width: 600px; margin: 0;">
    Get your local development environment up and running in under 5 minutes
  </p>
</div>

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** 18+ 
- **Git**
- **Docker** (for local development)
- Basic knowledge of blockchain development

## Step 1: Install AggSandbox

Clone and install AggSandbox, the local development environment for Agglayer:

```bash
# Clone AggSandbox
git clone https://github.com/agglayer/aggsandbox.git

# Navigate to the directory
cd aggsandbox

# Install dependencies
make install
```

## Step 2: Start Local Environment

Start your local Agglayer development environment:

```bash
# Start local development environment
aggsandbox start --detach

# Or fork from mainnet for testing with real data
aggsandbox start --fork --detach
```

## Step 3: Verify Installation

Check that your environment is running correctly:

```bash
# Check available bridges
aggsandbox show bridges --network 0

# Monitor events
aggsandbox events --chain anvil-l1
```

## Step 4: Your First Cross-chain Transaction

Now you're ready to make your first cross-chain transaction! Here's a simple example:

```bash
# Check the status of your local environment
aggsandbox status

# View available networks
aggsandbox show networks
```

## What's Next?

Now that you have AggSandbox running, you can:

- **Explore Examples**: Check out the [production-ready examples](https://build.agglayer.dev/) on the developer portal
- **Learn Bridging**: Start with [Asset Bridging](/agglayer/developer-tools/aggsandbox/asset-bridging/) to transfer tokens
- **Try Bridge-and-Call**: Learn about [Bridge-and-Call](/agglayer/developer-tools/aggsandbox/bridge-and-call/) for atomic operations
- **Use Agglayer SDK**: Integrate with the [Agglayer SDK](/agglayer/developer-tools/agglayer-sdk/) for your applications

## Troubleshooting

If you encounter any issues:

1. **Check Docker**: Make sure Docker is running
2. **Verify Ports**: Ensure ports 8545, 8546, and 8080 are available
3. **Restart Services**: Try `aggsandbox stop` then `aggsandbox start --detach`
4. **Check Logs**: Use `aggsandbox logs` to see detailed error messages
