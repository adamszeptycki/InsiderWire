/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "starter",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    await import("./infra/config");
    await import("./infra/router");
    await import("./infra/jobs");
    const { nextJsPage } = await import("./infra/nextPage");
    return {
      nextJsPage: nextJsPage.url,
    };
  },
});
