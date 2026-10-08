"use strict";
const path = require("path");
const { expect } = require("chai");
const { tests } = require("@iobroker/testing");

// Run integration tests against a real JS-Controller instance.
// The adapter's built-in test verifies the startup; the additional suite
// below checks that the missing air purifier does not crash the process.
// See https://github.com/ioBroker/ioBroker.testing for details.
tests.integration(path.join(__dirname, ".."), {
	defineAdditionalTests({ suite }) {
		suite("Adapter runs without device access", (getHarness) => {
			let harness;
			before(() => {
				harness = getHarness();
			});

			it("starts without connection and does not crash", async function () {
				this.timeout(120000);
				// The air purifier is not available in CI, so we must not wait for info.connection
				await harness.startAdapterAndWait(false);
				expect(harness.hasLog(/(TypeError|Class extends|Cannot find module|is not a constructor)/, "error")).to.be.false;
			});
		});
	},
});