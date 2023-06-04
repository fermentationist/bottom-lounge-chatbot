import customError from "./error";

describe("customError", () => {
  it("should return a custom error object with a name and a message", () => {
    const message = "error message";
    const name = "customError";
    const error = customError(name, message);
    expect(error instanceof Error).toEqual(true);
    expect(error.name).toEqual(name);
    expect(error.message).toEqual(message);
  });
});
