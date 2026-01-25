Feature: Isolator Architecture
  As a developer
  I want to use different isolators with different runtimes
  So that I can choose the right level of isolation for my use case

  # Isolator types:
  # - noop: No isolation, direct execution (for development/testing)
  # - srt: OS-level isolation via sandbox-runtime (Seatbelt/bubblewrap)
  # - cloudflare: Cloudflare Workers isolation
  # - e2b: E2B cloud sandbox

  # Runtime types:
  # - node: Node.js execution
  # - python: Python execution

  # ============================================
  # Noop Isolator (formerly "local")
  # ============================================

  @isolator @noop
  Scenario: Noop isolator with node runtime - shell
    Given I create a sandbox with "node" runtime and "noop" isolator
    When I run shell command "echo hello"
    Then the execution should succeed
    And the stdout should contain "hello"

  @isolator @noop
  Scenario: Noop isolator with node runtime - execute
    Given I create a sandbox with "node" runtime and "noop" isolator
    When I execute code "console.log('noop-node')"
    Then the execution should succeed
    And the stdout should contain "noop-node"

  @isolator @noop
  Scenario: Noop isolator with node runtime - evaluate
    Given I create a sandbox with "node" runtime and "noop" isolator
    When I evaluate expression "2 + 2"
    Then the evaluation should return "4"

  @isolator @noop
  Scenario: Noop isolator with python runtime - execute
    Given I create a sandbox with "python" runtime and "noop" isolator
    When I execute code "print('noop-python')"
    Then the execution should succeed
    And the stdout should contain "noop-python"

  @isolator @noop
  Scenario: Noop isolator with python runtime - evaluate
    Given I create a sandbox with "python" runtime and "noop" isolator
    When I evaluate expression "3 * 3"
    Then the evaluation should return "9"

  # ============================================
  # SRT Isolator (sandbox-runtime)
  # ============================================

  @isolator @srt
  Scenario: SRT isolator with node runtime - shell
    Given I create a sandbox with "node" runtime and "srt" isolator
    When I run shell command "echo hello-srt"
    Then the execution should succeed
    And the stdout should contain "hello-srt"

  @isolator @srt
  Scenario: SRT isolator with node runtime - execute
    Given I create a sandbox with "node" runtime and "srt" isolator
    When I execute code "console.log('srt-node')"
    Then the execution should succeed
    And the stdout should contain "srt-node"

  @isolator @srt
  Scenario: SRT isolator with node runtime - evaluate
    Given I create a sandbox with "node" runtime and "srt" isolator
    When I evaluate expression "10 / 2"
    Then the evaluation should return "5"

  @isolator @srt
  Scenario: SRT isolator with python runtime - execute
    Given I create a sandbox with "python" runtime and "srt" isolator
    When I execute code "print('srt-python')"
    Then the execution should succeed
    And the stdout should contain "srt-python"

  @isolator @srt
  Scenario: SRT isolator with python runtime - evaluate
    Given I create a sandbox with "python" runtime and "srt" isolator
    When I evaluate expression "4 ** 2"
    Then the evaluation should return "16"

  @isolator @srt @isolation
  Scenario: SRT isolator blocks file access outside workspace
    Given I create a sandbox with "node" runtime and "srt" isolator
    When I run shell command "cat /etc/passwd"
    Then the execution should fail

  # ============================================
  # Cloudflare Isolator
  # ============================================

  @isolator @cloudflare
  Scenario: Cloudflare isolator with node runtime - execute
    Given I create a sandbox with "node" runtime and "cloudflare" isolator
    When I execute code "console.log('cf-node')"
    Then the execution should succeed
    And the stdout should contain "cf-node"

  @isolator @cloudflare
  Scenario: Cloudflare isolator with python runtime - execute
    Given I create a sandbox with "python" runtime and "cloudflare" isolator
    When I execute code "print('cf-python')"
    Then the execution should succeed
    And the stdout should contain "cf-python"
