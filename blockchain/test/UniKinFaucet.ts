
import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("UniKinFaucet", function () {
  async function deployFaucet() {
    const [admin, user, otherUser] = await ethers.getSigners();

    const token = await ethers.deployContract("UniKinToken", [
      admin.address,
    ]);

    const amountPerRequest = ethers.parseUnits("100", 18);
    const cooldown = 3600n;

    const faucet = await ethers.deployContract("UniKinFaucet", [
      await token.getAddress(),
      admin.address,
      amountPerRequest,
      cooldown,
    ]);

    const faucetFunding = ethers.parseUnits("10000", 18);

    await token.transfer(await faucet.getAddress(), faucetFunding);

    return {
      admin,
      user,
      otherUser,
      token,
      faucet,
      amountPerRequest,
      cooldown,
      faucetFunding,
    };
  }

  it("Should distribute tokens to a user", async function () {
    const { user, token, faucet, amountPerRequest } =
      await deployFaucet();

    await faucet.connect(user).claim();

    expect(await token.balanceOf(user.address)).to.equal(
      amountPerRequest,
    );
  });

  it("Should prevent a user from claiming again during cooldown", async function () {
    const { user, faucet } = await deployFaucet();

    await faucet.connect(user).claim();

    await expect(
      faucet.connect(user).claim(),
    ).to.be.revert(ethers);
  });

  it("Should allow another user to claim independently", async function () {
    const { user, otherUser, token, faucet, amountPerRequest } =
      await deployFaucet();

    await faucet.connect(user).claim();
    await faucet.connect(otherUser).claim();

    expect(await token.balanceOf(user.address)).to.equal(
      amountPerRequest,
    );

    expect(await token.balanceOf(otherUser.address)).to.equal(
      amountPerRequest,
    );
  });

  it("Should allow the admin to change the claim amount", async function () {
    const { admin, faucet } = await deployFaucet();

    const newAmount = ethers.parseUnits("250", 18);

    await faucet.connect(admin).setAmountPerRequest(newAmount);

    expect(await faucet.amountPerRequest()).to.equal(newAmount);
  });

  it("Should reject amount changes by unauthorized users", async function () {
    const { user, faucet } = await deployFaucet();

    await expect(
      faucet.connect(user).setAmountPerRequest(ethers.parseUnits("250", 18)),
    ).to.be.revert(ethers);
  });

  it("Should allow the admin to change the cooldown", async function () {
    const { admin, faucet } = await deployFaucet();

    await faucet.connect(admin).setCooldown(7200);

    expect(await faucet.cooldown()).to.equal(7200n);
  });

  it("Should reject claims when the faucet is empty", async function () {
    const { admin, user, token, faucet } = await deployFaucet();

    const balance = await token.balanceOf(await faucet.getAddress());

    await faucet.connect(admin).withdrawTokens(admin.address, balance);

    await expect(
      faucet.connect(user).claim(),
    ).to.be.revert(ethers);
  });
});

