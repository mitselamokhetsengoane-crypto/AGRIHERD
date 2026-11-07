const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying AgriHerdRecords contract...");

  const AgriHerdRecords = await hre.ethers.getContractFactory("AgriHerdRecords");
  const contract = await AgriHerdRecords.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const deployer = (await hre.ethers.getSigners())[0];
  const network = hre.network.name;
  const blockNumber = await hre.ethers.provider.getBlockNumber();

  console.log("✅ AgriHerdRecords deployed successfully!");
  console.log("------------------------------------------");
  console.log(`Network:          ${network}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer:         ${deployer.address}`);
  console.log(`Block Number:     ${blockNumber}`);
  console.log("------------------------------------------");
  console.log("\n📋 Add this to your backend .env file:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`CONTRACT_NETWORK=${network}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });