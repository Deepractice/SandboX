Feature: State Persistence
  As a developer using SandboX
  I want to persist and restore sandbox state
  So that I can save progress and resume later

  @persistence
  Scenario: Save and restore state via StateStore
    Given I create a sandbox with state recording enabled
    When I write "config data" to file "config.txt"
    And I set environment variable "APP_ENV" to "production"
    And I set storage item "version" to "1.0.0"
    And I save the StateLog to store with key "example-session"
    And I create a new sandbox from stored StateLog "example-session"
    And I read file "config.txt"
    Then file "config.txt" should exist
    And the file content should be "config data"
    And environment variable "APP_ENV" should be "production"
    And storage item "version" should be "1.0.0"

  @persistence
  Scenario: StateStore persistence across instances
    Given I create a StateStore
    When I build a StateLog with file write and env set
    And I save the log to store with key "example-persist"
    And I load the log from store with key "example-persist"
    Then the loaded log should have 2 entries

  @persistence @id
  Scenario: Sandbox auto-generates unique ID
    Given I create a sandbox with state recording enabled
    Then the sandbox should have a unique ID
    And the ID should match pattern "sandbox-[a-zA-Z0-9_-]+"

  @persistence @auto
  Scenario: Auto-persist on every operation (enableRecord = autoPersist)
    Given I create a sandbox with enableRecord true
    When I write "data" to file "test.txt"
    And I set environment variable "KEY" to "value"
    Then the StateLog file should exist at "~/.agentvm/sandbox/{id}/state.jsonl"
    And the file should contain 2 lines

  @persistence @memory
  Scenario: Memory store for testing
    Given I create a sandbox with store "memory"
    When I write "data" to file "test.txt"
    Then no file should be created on disk
    And the StateLog should still record the operation
