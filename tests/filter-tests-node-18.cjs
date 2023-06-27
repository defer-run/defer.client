module.exports = (testPaths) => {
  const nodeVersionMajor = +(process.versions.node.split(".")[0] || "16");
  console.log(testPaths);
  const allowedPaths = testPaths
    .filter((path) =>
      nodeVersionMajor > 16 ? true : !path.match("asNextRoute")
    ) // filter out NextJS 13 tests
    .map((test) => ({ test })); // [{ test: "path1.spec.js" }, { test: "path2.spec.js" }, etc]

  return {
    filtered: allowedPaths,
  };
};