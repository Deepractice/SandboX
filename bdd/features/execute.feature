Feature: Code Execution
  As a developer
  I want to execute code in a sandbox
  So that I can safely run untrusted code

  @execute
  Scenario: Execute simple Node.js code
    Given I create a sandbox with "node" runtime and "local" isolator
    When I execute code "console.log('Hello World')"
    Then the execution should succeed
    And the stdout should contain "Hello World"

  @execute
  Scenario: Execute code with error
    Given I create a sandbox with "node" runtime and "local" isolator
    When I execute code "throw new Error('Test error')"
    Then the execution should fail
    And the stderr should contain "Error: Test error"

  @execute
  Scenario: Execute code with timeout
    Given I create a sandbox with "node" runtime and "local" isolator
    When I execute code "while(true) {}" with timeout 1000
    Then the execution should timeout

  @execute
  Scenario: Execute code with environment variables
    Given I create a sandbox with "node" runtime and "local" isolator
    When I execute code "console.log(process.env.TEST_VAR)" with env "TEST_VAR=hello"
    Then the execution should succeed
    And the stdout should contain "hello"
