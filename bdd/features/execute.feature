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
    Then the execution should throw an error
    And the error message should contain "Test error"

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

  @execute @python
  Scenario: Execute simple Python code
    Given I create a sandbox with "python" runtime and "local" isolator
    When I execute code "print('Hello from Python')"
    Then the execution should succeed
    And the stdout should contain "Hello from Python"

  @execute @python
  Scenario: Execute Python with imports
    Given I create a sandbox with "python" runtime and "local" isolator
    When I execute code "import sys; print(sys.version)"
    Then the execution should succeed
    And the stdout should contain "."

  @execute @shell
  Scenario: Execute shell command
    Given I create a sandbox with "shell" runtime and "local" isolator
    When I run shell command "echo 'Hello from Shell'"
    Then the execution should succeed
    And the stdout should contain "Hello from Shell"

  @execute @shell
  Scenario: Execute shell command with pipes
    Given I create a sandbox with "shell" runtime and "local" isolator
    When I run shell command "echo 'test' | wc -l"
    Then the execution should succeed
    And the stdout should contain "1"

  @execute @evaluate
  Scenario: Evaluate Node.js expression
    Given I create a sandbox with "node" runtime and "local" isolator
    When I evaluate expression "1 + 1"
    Then the evaluation should return "2"

  @execute @evaluate
  Scenario: Evaluate expression with array
    Given I create a sandbox with "node" runtime and "local" isolator
    When I evaluate expression "[1,2,3].map(x => x * 2)"
    Then the evaluation should return "[ 2, 4, 6 ]"

  @execute @evaluate
  Scenario: Evaluate expression with error
    Given I create a sandbox with "node" runtime and "local" isolator
    When I evaluate expression "throw new Error('eval error')"
    Then the execution should throw an error
    And the error message should contain "eval error"

  @execute @evaluate @python
  Scenario: Evaluate Python expression
    Given I create a sandbox with "python" runtime and "local" isolator
    When I evaluate expression "1 + 1"
    Then the evaluation should return "2"
