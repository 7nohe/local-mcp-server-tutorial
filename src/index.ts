#!/usr/bin/env node
async function main() {
  console.error("Hello, world!");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
