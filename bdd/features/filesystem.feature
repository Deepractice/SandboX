Feature: File System Operations
  As a developer
  I want to perform file operations in a sandbox
  So that I can manage files safely

  @filesystem
  Scenario: Write and read a file
    Given I create a sandbox with "node" runtime and "local" isolator
    When I write "Hello World" to file "test.txt"
    And I read file "test.txt"
    Then the file content should be "Hello World"

  @filesystem
  Scenario: Check file existence
    Given I create a sandbox with "node" runtime and "local" isolator
    When I write "content" to file "exists.txt"
    Then file "exists.txt" should exist
    And file "notexists.txt" should not exist

  @filesystem
  Scenario: List directory contents
    Given I create a sandbox with "node" runtime and "local" isolator
    When I write "file1" to file "file1.txt"
    And I write "file2" to file "file2.txt"
    Then directory "." should contain "file1.txt"
    And directory "." should contain "file2.txt"

  @filesystem
  Scenario: Delete a file
    Given I create a sandbox with "node" runtime and "local" isolator
    When I write "content" to file "delete.txt"
    And I delete file "delete.txt"
    Then file "delete.txt" should not exist
