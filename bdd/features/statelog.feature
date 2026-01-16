Feature: StateLog Integration
  As a developer using SandboX
  I want to use StateLog for initializing and recording state
  So that I can persist and restore sandbox states

  @statelog @initialize
  Scenario: Initialize sandbox from StateLog
    Given I build a StateLog with operations:
      | op          | path      | data            | key      | value      |
      | fs.write    | test.json | {"test": true}  |          |            |
      | env.set     |           |                 | NODE_ENV | production |
      | storage.set |           |                 | version  | 1.0.0      |
    When I create sandbox with the StateLog
    Then file "test.json" should exist
    And environment variable "NODE_ENV" should be "production"
    And storage item "version" should be "1.0.0"

  @statelog @record
  Scenario: Record operations to StateLog
    Given I create a sandbox with state recording enabled
    When I write "hello" to file "a.txt"
    And I set environment variable "DEBUG" to "true"
    And I set storage item "count" to "10"
    Then the StateLog should have 3 entries
    And StateLog entry 0 should be "fs.write"
    And StateLog entry 1 should be "env.set"
    And StateLog entry 2 should be "storage.set"

  @statelog @serialize
  Scenario: Serialize and deserialize StateLog
    Given I create a sandbox with state recording enabled
    When I write "data" to file "test.txt"
    And I export the StateLog as JSON
    Then the JSON should be valid
    And loading the JSON should restore the StateLog
