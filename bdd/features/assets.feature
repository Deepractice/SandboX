Feature: Binary File Transfer
  As a developer using SandboX
  I want to upload and download binary files
  So that I can work with images, archives, and other binary data

  Background:
    Given I create a sandbox with "node" runtime and "local" isolator

  @assets @upload
  Scenario: Upload binary file to sandbox
    When I upload binary data "SGVsbG8gV29ybGQ=" to "data.bin"
    Then file "data.bin" should exist

  @assets @download
  Scenario: Download binary file from sandbox
    When I upload binary data "VGVzdCBEYXRh" to "test.bin"
    And I download binary file "test.bin"
    Then the downloaded data should be "VGVzdCBEYXRh"

  @assets @roundtrip
  Scenario: Upload and download roundtrip
    When I upload binary data "Um91bmR0cmlw" to "roundtrip.bin"
    And I download binary file "roundtrip.bin"
    Then the downloaded data should be "Um91bmR0cmlw"
