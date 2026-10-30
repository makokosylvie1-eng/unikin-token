import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("UniKinToken", function () {
  async function deployToken() {
    const [admin, user, other] = await ethers.getSigners();

    const token = await ethers.deployContract("UniKinToken", [
      admin.address,
    ]);

    return { token, admin, user, other };
  }

  it("Should have the correct name and symbol", async function () {
    const { token } = await deployToken();

    expect(await token.name()).to.equal("UniKin Token");
    expect(await token.symbol()).to.equal("UKT");
    expect(await token.decimals()).to.equal(18n);
  });

  it("Should distribute the initial supply to the admin", async function () {
    const { token, admin } = await deployToken();

    const initialSupply = ethers.parseUnits("1000000", 18);

    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.balanceOf(admin.address)).to.equal(initialSupply);
  });

  it("Should allow the minter to create new tokens", async function () {
    const { token, user } = await deployToken();

    const amount = ethers.parseUnits("100", 18);

    await token.mint(user.address, amount);

    expect(await token.balanceOf(user.address)).to.equal(amount);
  });

  it("Should reject minting by an unauthorized user", async function () {
    const { token, user, other } = await deployToken();

    const amount = ethers.parseUnits("100", 18);

    await expect(
      token.connect(user).mint(other.address, amount),
    ).to.revert(ethers);
  });

  it("Should not exceed the maximum supply", async function () {
    const { token, admin } = await deployToken();

    const amount = ethers.parseUnits("9000001", 18);

    await expect(
      token.mint(admin.address, amount),
    ).to.revert(ethers);
  });

  it("Should allow a holder to burn their tokens", async function () {
    const { token, admin } = await deployToken();

    const amount = ethers.parseUnits("100", 18);

    await token.burn(amount);

    expect(await token.balanceOf(admin.address)).to.equal(
      ethers.parseUnits("999900", 18),
    );

    expect(await token.totalSupply()).to.equal(
      ethers.parseUnits("999900", 18),
    );
  });
});
