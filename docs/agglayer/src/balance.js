const { getLxLyClient, tokens, configuration, from } = require('./utils/utils_lxly');

const execute = async () => {
  // instantiate a lxlyclient
  const client = await getLxLyClient();
  // Sepolia NetworkId is 0, Cardona NetworkId is 1
  const networkId = 0;
  // get an api instance of ether token on sepolia testnet
  const erc20Token = client.erc20(tokens[networkId].ether, networkId);
  // check balance
  const result = await erc20Token.getBalance(from);
  console.log("result", result);
}

execute().then(() => {
}).catch(err => {
  console.error("err", err);
}).finally(_ => {
  process.exit(0);
});