require("dotenv/config");

const PRIVATE_KEY_ACCOUNT_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA_NETWORK;
const PRIVATE_KEY_2_ACCOUNT_SEPOLIA = process.env.PRIVATE_KEY_2_SEPOLIA_NETWORK;
const PRIVATE_KEY_ALVA_PRODUCTION = process.env.PRIVATE_KEY_ALVA_PRODUCTION;

const networkConfig = {
  1337: {
    name: "localhost",
    deployerKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    alvaAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    minter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    burner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  31337: {
    name: "localhost",
    deployerKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    alvaAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    minter: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    burner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  11155111: {
    name: "sepolia",
    deployerKey: PRIVATE_KEY_ACCOUNT_SEPOLIA,
    alvaAddress: "0x0fc4580f70C517B148a141f3721C5138f74401b1",
    deployerAddress: "0xA5de4D331f7A61dd0179b4f1493EC1e2D713AE29",
    minter: null,
    burner: null,
    owner: null,
    wthAddress: "0xD26d007552DC4733Ce9Cd309c9c3cf6987140883",
    router: "0x73f19dECFd263f09139c5A4DEe9B5aBc535828DF",
  },
  43113: {
    name: "fuji",
    deployerKey: PRIVATE_KEY_ACCOUNT_SEPOLIA,
    alvaAddress: "0x53ca8E73cbE1444B05d8D5b5B825aa7347a4df8D",
    deployerAddress: "0xA5de4D331f7A61dd0179b4f1493EC1e2D713AE29",
    minter: null,
    burner: null,
    owner: null,
    admin: null,
    user1Key: PRIVATE_KEY_2_ACCOUNT_SEPOLIA,
  },
  43114: {
    name: "avalancheMainnet",
    deployerKey: PRIVATE_KEY_ALVA_PRODUCTION,
    alvaAddress: "0xd18555A6C2FDa350069735419900478eec4Abd96",
    deployerAddress: "0x16867a85C80cC76E4d80be0b834B7B61f96A4158",
    minter: null,
    burner: null,
    owner: null,
    admin: null,
    user1Key: PRIVATE_KEY_2_ACCOUNT_SEPOLIA,
  },
  1: {
    name: "Ethereum",
    deployerKey: PRIVATE_KEY_ALVA_PRODUCTION,
    alvaAddress: "0x8e729198d1C59B82bd6bBa579310C40d740A11C2",
    deployerAddress: "0x16867a85C80cC76E4d80be0b834B7B61f96A4158",
    minter: null,
    burner: null,
    owner: null,
    admin: null,
    user1Key: PRIVATE_KEY_2_ACCOUNT_SEPOLIA,
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
