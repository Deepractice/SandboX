/**
 * Cucumber.js configuration for SandboX
 *
 * Usage:
 *   bun test:bdd                         # Fast tests only
 *   bun test:bdd --tags @cloudflare      # Cloudflare tests (slow)
 *   bun test:bdd --tags @execute         # Only execute tests
 *   bun test:bdd --tags @filesystem      # Only filesystem tests
 */

export default {
  format: ["progress-bar", "html:reports/cucumber-report.html"],
  formatOptions: { snippetInterface: "async-await" },
  import: ["steps/**/*.ts"],
  paths: ["features/**/*.feature"],
  tags: "not @pending and not @slow and not @cloudflare", // Exclude slow tests by default
  worldParameters: {
    defaultTimeout: 30000,
  },
};
