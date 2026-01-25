@documentation @readme
Feature: README Examples
  As a user reading the documentation
  I want all README code examples to work correctly
  So that I can trust the documentation

  # ==========================================
  # packages/sandboxxjs/README.md examples
  # ==========================================

  @documentation @quick-start
  Scenario: Quick Start - Execute Node.js code
    Given I create a sandbox with "node" runtime and "none" isolator
    When I execute code "console.log('Hello World')"
    Then the execution should succeed
    And the stdout should contain "Hello World"

  @documentation @multi-language
  Scenario: Multi-Language - Node.js runtime
    Given I create a sandbox with "node" runtime and "none" isolator
    When I execute code "console.log('Node.js works')"
    Then the execution should succeed

  @documentation @multi-language
  Scenario: Multi-Language - Python runtime
    Given I create a sandbox with "python" runtime and "none" isolator
    When I execute code "print('Python works')"
    Then the execution should succeed
    And the stdout should contain "Python works"

  @documentation @filesystem
  Scenario: File System - Write and read file
    Given I create a sandbox with "node" runtime and "none" isolator
    When I write "data" to file "file.txt"
    And I read file "file.txt"
    Then the file content should be "data"

  @documentation @filesystem
  Scenario: File System - List directory
    Given I create a sandbox with "node" runtime and "none" isolator
    When I write "content" to file "file.txt"
    Then directory "." should contain "file.txt"

  # ==========================================
  # packages/core/README.md examples
  # ==========================================

  @documentation @core
  Scenario: Core - Execute code and check stdout
    Given I create a sandbox with "node" runtime and "none" isolator
    When I execute code "console.log('Hello')"
    Then the execution should succeed
    And the stdout should contain "Hello"

  # ==========================================
  # Isolator examples (from README)
  # ==========================================

  @documentation @isolator @none
  Scenario: Isolator - None isolator works
    Given I create a sandbox with "node" runtime and "none" isolator
    When I execute code "console.log('none isolator')"
    Then the execution should succeed
    And the stdout should contain "none isolator"

  @documentation @isolator @srt
  Scenario: Isolator - SRT isolator works
    Given I create a sandbox with "node" runtime and "srt" isolator
    When I execute code "console.log('srt isolator')"
    Then the execution should succeed
    And the stdout should contain "srt isolator"

  @documentation @isolator @cloudflare @slow
  Scenario: Isolator - Cloudflare isolator works
    Given I create a sandbox with "node" runtime and "cloudflare" isolator
    When I execute code "console.log('cloudflare isolator')"
    Then the execution should succeed
    And the stdout should contain "cloudflare isolator"
