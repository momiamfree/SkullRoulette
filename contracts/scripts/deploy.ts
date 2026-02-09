import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1️⃣ Deploy del token
  const TokenFactory = await ethers.getContractFactory("RouletteToken");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  console.log("RouletteToken deployed at:", await token.getAddress());

  // 2️⃣ Deploy de la ruleta pasando la dirección del token
  const RouletteFactory = await ethers.getContractFactory("Roulette");
  const roulette = await RouletteFactory.deploy(await token.getAddress());
  await roulette.waitForDeployment();
  console.log("Roulette deployed at:", await roulette.getAddress());

  // 3️⃣ Dar 1000 tokens al contrato de Roulette para payouts
  let tx = await token.transfer(await roulette.getAddress(), ethers.parseUnits("1000", 18));
  await tx.wait();
  console.log("1000 RLT sent to Roulette contract for payouts");

  // 4️⃣ Dar 100 token al deployer para apostar
  tx = await token.transfer(deployer.address, ethers.parseUnits("100", 18));
  await tx.wait();
  console.log("100 RLT sent to deployer for betting");

  // 5️⃣ Approve del deployer hacia Roulette
  tx = await token.connect(deployer).approve(await roulette.getAddress(), ethers.parseUnits("1", 18));
  await tx.wait();
  console.log("1 RLT approved to Roulette contract");

  // 6️⃣ Hacer spin de 1 token
  const receipt = await roulette.connect(deployer).spin(ethers.parseUnits("1", 18));
  console.log("Spin executed! Transaction hash:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
