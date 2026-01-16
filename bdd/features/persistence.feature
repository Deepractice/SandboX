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
    And I save the StateLog to store with key "test-session"
    And I create a new sandbox from stored StateLog "test-session"
    And I read file "config.txt"
    Then file "config.txt" should exist
    And the file content should be "config data"
    And environment variable "APP_ENV" should be "production"
    And storage item "version" should be "1.0.0"

  @persistence
  Scenario: StateStore memory implementation
    Given I create a StateStore
    When I build a StateLog with file write and env set
    And I save the log to store with key "persistent-session"
    And I load the log from store with key "persistent-session"
    Then the loaded log should have 2 entries
