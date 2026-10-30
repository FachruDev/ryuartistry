/** Setup snippets for Claude Code and Claude Desktop. Shared by the server page and the token form. */
export function connectCommands(endpoint: string, token: string) {
  return {
    claudeCode: `claude mcp add --transport http --scope user ryuartistry ${endpoint} --header "Authorization: Bearer ${token}"`,
    claudeDesktop: JSON.stringify(
      {
        mcpServers: {
          ryuartistry: {
            command: "npx",
            args: ["-y", "mcp-remote", endpoint, "--header", "Authorization:${RYU_AUTH}"],
            env: { RYU_AUTH: `Bearer ${token}` },
          },
        },
      },
      null,
      2,
    ),
  };
}
