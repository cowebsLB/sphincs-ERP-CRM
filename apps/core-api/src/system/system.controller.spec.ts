import { SystemController } from "./system.controller";

describe("SystemController", () => {
  it("returns system info shape", () => {
    const controller = new SystemController();
    const info = controller.info();
    expect(info).toHaveProperty("version");
    expect(info).toHaveProperty("environment");
    expect(info).toHaveProperty("build_hash");
    expect(info).toHaveProperty("timestamp");
  });
});
