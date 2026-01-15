Feature: Cloudflare Container Execution
  As a developer
  I want to execute code in Cloudflare Containers
  So that I can use serverless containers

  @cloudflare @slow
  Scenario: Execute Node.js code in Cloudflare Container
    Given I create a sandbox with "node" runtime and "cloudflare" isolator
    When I execute code "console.log('Hello from Cloudflare')"
    Then the execution should succeed
    And the stdout should contain "Hello from Cloudflare"

  @cloudflare @slow
  Scenario: Execute Python code in Cloudflare Container
    Given I create a sandbox with "python" runtime and "cloudflare" isolator
    When I execute code "print('Python in Cloudflare')"
    Then the execution should succeed
    And the stdout should contain "Python in Cloudflare"
