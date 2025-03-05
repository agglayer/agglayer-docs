const dotenv = require('dotenv')
const path = require('path');
const env = dotenv.config({
    path: path.join(__dirname, '.env')
});

if (env.error) {
    throw new Error("no env file found");
}

module.exports = {
    network: process.env.NETWORK || 'testnet',
    configuration: {
        0: {
            rpc: process.env.NETWORK_0_RPC || 'https://rpc.sepolia.org',
            bridgeAddress: process.env.NETWORK_0_BRIDGE || '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582',
            bridgeExtensionAddress: process.env.NETWORK_0_BRIDGE_EXTENSION || '0x2311BFA86Ae27FC10E1ad3f805A2F9d22Fc8a6a1',
            wrapperAddress: '0x0f04f8434bac2e1db8fca8a34d3e177b6c7ccaba',
            isEIP1559Supported: true
        },
        1: {
            rpc: process.env.NETWORK_1_RPC || 'https://rpc.cardona.zkevm-rpc.com',
            bridgeAddress: process.env.NETWORK_1_BRIDGE || '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582',
            bridgeExtensionAddress: process.env.NETWORK_1_BRIDGE_EXTENSION || '0x2311BFA86Ae27FC10E1ad3f805A2F9d22Fc8a6a1',
            isEIP1559Supported: true
        },
        16: {
            rpc: process.env.NETWORK_2_RPC || 'https://rpc-sepolia.silicon.network',
            bridgeAddress: process.env.NETWORK_2_BRIDGE || '0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582',
            bridgeExtensionAddress: process.env.NETWORK_2_BRIDGE_EXTENSION || '0x2311BFA86Ae27FC10E1ad3f805A2F9d22Fc8a6a1',
            isEIP1559Supported: true
        }
    },
    tokens: {
        0: {
            ether: '0x0000000000000000000000000000000000000000',
        },
        1: {
            ether: '0x0000000000000000000000000000000000000000',
        },
        16: {
            ether: '0x0000000000000000000000000000000000000000',
        }
    },
    user1: {
        privateKey: process.env.USER1_PRIVATE_KEY,
        address: process.env.USER1_FROM
    },
    // user2: {
    //     address: process.env.USER2_FROM,
    //     privateKey: process.env.USER2_PRIVATE_KEY,
    // },
}