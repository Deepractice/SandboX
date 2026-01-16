Feature: State Management
  As a developer using SandboX
  I want to manage state (environment variables and storage)
  So that I can configure and persist data across operations

  Background:
    Given I create a sandbox with "node" runtime and "local" isolator

  @env
  Scenario: Set and get environment variable
    When I set environment variable "API_KEY" to "secret123"
    Then environment variable "API_KEY" should be "secret123"

  @env
  Scenario: Check environment variable existence
    When I set environment variable "DEBUG" to "true"
    Then environment variable "DEBUG" should exist
    And environment variable "UNDEFINED_VAR" should not exist

  @env
  Scenario: Delete environment variable
    When I set environment variable "TEMP_VAR" to "value"
    And I delete environment variable "TEMP_VAR"
    Then environment variable "TEMP_VAR" should not exist

  @env
  Scenario: Initialize environment variables from config
    Given I create a sandbox with "node" runtime and "local" isolator and env "INIT_VAR=init_value"
    Then environment variable "INIT_VAR" should be "init_value"

  @env
  Scenario: Get all environment variables
    When I set environment variable "KEY1" to "value1"
    And I set environment variable "KEY2" to "value2"
    Then all environment variables should include "KEY1" and "KEY2"

  @storage
  Scenario: Set and get storage item
    When I set storage item "count" to "42"
    Then storage item "count" should be "42"

  @storage
  Scenario: Remove storage item
    When I set storage item "temp" to "data"
    And I remove storage item "temp"
    Then storage item "temp" should be null

  @storage
  Scenario: Clear all storage
    When I set storage item "key1" to "value1"
    And I set storage item "key2" to "value2"
    And I clear storage
    Then storage item "key1" should be null
    And storage item "key2" should be null

  @storage
  Scenario: List storage keys
    When I set storage item "alpha" to "a"
    And I set storage item "beta" to "b"
    Then storage should contain keys "alpha,beta"
