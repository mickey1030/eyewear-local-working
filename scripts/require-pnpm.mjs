// Cross-platform replacement for the old `sh -c 'rm -f ...; case ...'` preinstall hook.
// Works in cmd.exe, PowerShell, Git Bash, macOS and Linux (pure Node, no shell).
const agent = process.env.npm_config_user_agent ?? "";

if (!agent.startsWith("pnpm/")) {
  console.error(
    "\nThis workspace must be installed with pnpm.\n" +
      "  1) corepack enable          (or: npm install -g pnpm)\n" +
      "  2) pnpm install\n",
  );
  process.exit(1);
}
