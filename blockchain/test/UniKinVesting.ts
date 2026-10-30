import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("UniKinVesting", function () {
  async function deployVesting() {
    const [admin, beneficiary] = await ethers.getSigners();

    const token = await ethers.deployContract("UniKinToken", [
      admin.address,
    ]);

    const latestBlock = await ethers.provider.getBlock("latest");
    if (!latestBlock) {
      throw new Error("Impossible de lire le dernier bloc");
    }

    const start = BigInt(latestBlock.timestamp + 100);
    const duration = 1000n;

    const vesting = await ethers.deployContract("UniKinVesting", [
      beneficiary.address,
      start,
      duration,
    ]);

    const allocation = ethers.parseUnits("120000", 18);
    await token.transfer(await vesting.getAddress(), allocation);

    return { token, vesting, beneficiary, start, duration, allocation };
  }

  it("Should assign the correct beneficiary", async function () {
    const { vesting, beneficiary } = await deployVesting();
    expect(await vesting.owner()).to.equal(beneficiary.address);
  });

  it("Should release no tokens before vesting starts", async function () {
    const { token, vesting, start } = await deployVesting();

    await ethers.provider.send("evm_setNextBlockTimestamp", [
      Number(start - 1n),
    ]);
    await ethers.provider.send("evm_mine", []);

    expect(
      await vesting["releasable(address)"](await token.getAddress()),
    ).to.equal(0n);
  });

  it("Should release tokens progressively during vesting", async function () {
    const { token, vesting, beneficiary, start, duration, allocation } =
      await deployVesting();

    const halfway = start + duration / 2n;

    await ethers.provider.send("evm_setNextBlockTimestamp", [
      Number(halfway),
    ]);
    await ethers.provider.send("evm_mine", []);

    const tokenAddress = await token.getAddress();

    const releasable = await vesting["releasable(address)"](tokenAddress);

    expect(releasable).to.be.closeTo(
      allocation / 2n,
      ethers.parseUnits("1", 18),
    );

    await vesting
      .connect(beneficiary)
      ["release(address)"](tokenAddress);

    expect(await token.balanceOf(beneficiary.address)).to.equal(
      await vesting["released(address)"](tokenAddress),
    );
  });

  it("Should release the full allocation at the end", async function () {
    const { token, vesting, beneficiary, start, duration, allocation } =
      await deployVesting();

    await ethers.provider.send("evm_setNextBlockTimestamp", [
      Number(start + duration),
    ]);
    await ethers.provider.send("evm_mine", []);

    await vesting
      .connect(beneficiary)
      ["release(address)"](await token.getAddress());

    expect(await token.balanceOf(beneficiary.address)).to.equal(allocation);
  });
});
