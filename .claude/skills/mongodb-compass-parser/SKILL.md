---
name: mongodb-compass-parser
description: Parse and analyze MongoDB Compass data modeling JSON exports. Validates schema structure, analyzes collections, relationships, and provides insights. Use when working with MongoDB schemas or files matching "*compass*.json" or "*-db_*.json".
argument-hint: <file-path>
disable-model-invocation: false
user-invocable: true
allowed-tools: Read
context: fork
agent: Explore
---

# MongoDB Compass Schema Parser

Parse and analyze MongoDB Compass data modeling JSON exports to validate schema structure, analyze relationships, and generate comprehensive insights about your database design.

## Purpose

This skill reads MongoDB Compass data modeling export files and provides:
- Schema structure validation
- Collection and field statistics
- Relationship mapping with cardinality analysis
- Type distribution analysis
- Issue detection and recommendations

## Usage

Invoke this skill with the path to a MongoDB Compass export JSON file:

```
/mongodb-compass-parser <file-path>
```

**Example:**
```
/mongodb-compass-parser demoparser-db_23_02_2026.json
```

## Input Format

The skill expects a JSON file exported from MongoDB Compass data modeling tab with this structure:

```json
{
  "collections": {
    "database.collection-name": {
      "ns": "database.collection-name",
      "jsonSchema": {
        "bsonType": "object",
        "properties": { ... },
        "required": [...]
      }
    }
  },
  "relationships": [
    {
      "id": "unique-id",
      "relationship": [...],
      "isInferred": false
    }
  ]
}
```

## Execution Steps

### Step 1: Read and Parse the Export File

First, read the file specified in the arguments:

```
File path: $ARGUMENTS[0]
```

Use the Read tool to load the file contents. If the file doesn't exist, report an error and exit.

After reading, parse the JSON. If parsing fails, report the JSON syntax error and exit.

### Step 2: Validate Structure

Check that the parsed JSON has the required top-level keys:
- `collections` (must be an object)
- `relationships` (must be an array)

If either is missing, report an error with the missing key name.

### Step 3: Parse Collections

For each entry in the `collections` object:

1. **Extract Collection Name:**
   - The key format is "database.collection-name"
   - Extract the collection name (part after the last dot)
   - Extract the database name (part before the last dot)

2. **Validate Collection Structure:**
   - Check `ns` field exists and matches the key
   - Check `jsonSchema` object exists
   - Check `jsonSchema.bsonType` equals "object"
   - Check `jsonSchema.properties` exists

3. **Parse Fields:**
   - For each field in `properties`:
     - Extract field name
     - Extract `bsonType` (can be string or array of strings)
     - If bsonType is array, check if it contains "null" (nullable field)
     - If field has `properties`, mark as nested object
     - Count total fields (including nested)

4. **Parse Required Fields:**
   - Extract `required` array from jsonSchema
   - Validate that each required field exists in properties

5. **Collect Statistics:**
   - Field count per collection
   - Required field count
   - BSON type distribution
   - Nested object count

### Step 4: Parse Relationships

For each entry in the `relationships` array:

1. **Extract Relationship Data:**
   - Get relationship ID
   - Extract the two relationship entities (should be array of length 2)
   - For each entity:
     - Extract `ns` (namespace/collection name)
     - Extract `cardinality` (1 or null)
     - Extract `fields` (array of field names/paths)
   - Extract `isInferred` boolean

2. **Determine Relationship Type:**
   - Based on cardinality values of both entities:
     - `[1, 1]` = One-to-One
     - `[null, 1]` = Many-to-One
     - `[1, null]` = One-to-Many
     - `[null, null]` = Many-to-Many

3. **Parse Field Paths:**
   - Fields can be simple: `["field_name"]`
   - Or nested: `["parent_field", "child_field"]`
   - Join nested paths with dot notation for display

4. **Validate Relationships:**
   - Check that both `ns` values reference existing collections
   - Check that field paths exist in their respective collection schemas
   - For nested paths, traverse the schema properties recursively

### Step 5: Validate Schema

Run validation checks and collect errors/warnings:

**Collection Validation:**
- All `ns` values follow "database.collection" format
- All collections have `jsonSchema.bsonType: "object"`
- All `required` fields reference actual properties

**Type Validation:**
- All `bsonType` values are valid BSON types:
  - Valid types: objectId, string, int, long, decimal, double, bool, date, object, array, null
- Flag unknown types as warnings

**Relationship Validation:**
- Both collections in relationship exist
- All field paths are valid
- Cardinality values are 1 or null

### Step 6: Analyze and Generate Statistics

Calculate the following metrics:

**Overall Statistics:**
- Total collections count
- Total relationships count
- Total fields across all collections
- Average fields per collection
- Collections with most/least fields

**Type Distribution:**
- Count occurrences of each BSON type
- Calculate percentage of total fields
- Identify most common types

**Relationship Statistics:**
- Count by type (1:1, 1:N, N:M)
- Inferred vs explicit count
- Most connected collections
- Orphaned collections (no relationships)

**Quality Metrics:**
- Collections with no required fields
- Collections with only _id field
- Nullable field count
- Collections with nested objects

### Step 7: Generate Report

Create a comprehensive Markdown report with the following structure:

---

## Report Template

```markdown
# MongoDB Compass Schema Analysis

**Database**: {database_name}
**File**: {file_path}
**Analysis Date**: {current_date}

---

## Summary Statistics

- **Total Collections**: {collection_count}
- **Total Relationships**: {relationship_count}
- **Total Fields**: {total_field_count}
- **Average Fields per Collection**: {avg_fields}

---

## Validation Results

{List validation results with checkmarks or warnings}

Examples:
✓ Schema structure is valid
✓ All BSON types are recognized
✓ All relationships reference existing collections
⚠️ 3 collections have no required fields (except _id)

---

## Collections Overview

| Collection | Fields | Required | Relationships |
|------------|--------|----------|---------------|
{For each collection, create a table row with stats}

---

## Relationship Map

| From | To | Type | Fields | Inferred |
|------|----|----- |--------|----------|
{For each relationship, create a table row}

Format examples:
- From: collection1 → collection2
- Type: Many-to-One / One-to-Many / One-to-One / Many-to-Many
- Fields: source_field → target_field
- Inferred: Yes / No

---

## Type Distribution

{List BSON types with counts and percentages}

Example format:
- string: 45 fields (35.2%)
- int: 30 fields (23.4%)
- date: 12 fields (9.4%)
...

---

## Collections Detail

{For each collection, create a detailed section}

### {collection_name}

- **Namespace**: {full_namespace}
- **Fields**: {field_count}
- **Required Fields**: {required_field_list or "None (except _id)"}
- **Nested Objects**: {nested_object_count}

**Schema**:
{List all fields with their types}
- `field_name`: type (nullable if applicable)
- `nested_field`: object
  - `nested.subfield`: type

**Relationships**:
{List relationships involving this collection}
- References: {target_collection} via {field_path}
- Referenced by: {source_collection} via {field_path}

---

## Issues & Recommendations

### Errors
{List critical errors found during validation}

### Warnings
{List warnings about schema quality}

Examples:
1. ⚠️ Collection `player_best_positions` has only 1 field (_id)
2. ⚠️ Collection `user` has no required fields except _id
3. ⚠️ {count} fields allow null values

### Suggestions
{Provide actionable recommendations}

Examples:
1. ℹ️ Consider adding indexes on foreign key fields used in relationships
2. ℹ️ Collections with 5+ relationships may benefit from schema optimization
3. ℹ️ Add required constraints to essential fields

---

*Generated by MongoDB Compass Parser Skill*
```

---

## Implementation Details

### Parsing Nested Field Paths

When validating relationship field paths like `["participants", "user_id"]`:

1. Start with the collection's `properties` object
2. For each segment in the path:
   - Check if the segment exists as a key in current properties
   - If the field has its own `properties`, navigate into it
   - Continue until all segments are validated
3. If any segment is missing, report an error

### Handling Nullable Types

BSON types can be arrays indicating union types:

```json
{
  "bsonType": ["string", "null"]
}
```

When encountering an array bsonType:
1. Check if "null" is present in the array
2. If yes, mark the field as nullable
3. List all non-null types as the field's actual type

### Cardinality Interpretation

The `cardinality` field in relationships:
- `1` means exactly one (singular)
- `null` means many (plural/multiple)

Combine both entities' cardinality to determine relationship type:
- Entity A has cardinality `null`, Entity B has `1` = Many-to-One (A → B)
- Entity A has cardinality `1`, Entity B has `null` = One-to-Many (A → B)
- Both have `1` = One-to-One
- Both have `null` = Many-to-Many

### Database Name Extraction

From namespace like "demoparser-db.user":
- Split by last dot
- Before dot: "demoparser-db" (database name)
- After dot: "user" (collection name)

## Error Messages

Use these standardized error messages:

**File Errors:**
- ❌ Error: File not found at {path}
- ❌ Error: Cannot read file: {error_message}

**JSON Errors:**
- ❌ Error: Invalid JSON format
  - Details: {parse_error}

**Structure Errors:**
- ❌ Error: Missing required key: "{key_name}"
  - Expected: "collections" and "relationships" at top level

**Collection Errors:**
- ❌ Error: Invalid collection structure in "{collection_key}"
  - Missing: {missing_field}

**Type Errors:**
- ⚠️ Warning: Unknown BSON type "{type}" in collection "{collection}", field "{field}"
  - Valid types: objectId, string, int, long, decimal, double, bool, date, object, array, null

**Relationship Errors:**
- ❌ Error: Relationship "{id}" references non-existent collection: "{ns}"
- ❌ Error: Invalid field path in relationship "{id}"
  - Collection: {collection}
  - Path: {field_path}
  - Issue: Field does not exist in schema

**Validation Warnings:**
- ⚠️ Warning: Collection "{collection}" has no required fields (except _id)
- ⚠️ Warning: Collection "{collection}" has only 1 field (_id)
- ⚠️ Warning: Field "{field}" in "{collection}" allows null values

## Output Guidelines

1. **Use emojis for visual clarity:**
   - ✓ for success/valid items
   - ❌ for errors
   - ⚠️ for warnings
   - ℹ️ for informational messages

2. **Use tables for structured data:**
   - Collections overview
   - Relationship mapping
   - Field listings

3. **Use code formatting:**
   - Wrap field names in backticks: `field_name`
   - Use code blocks for JSON examples

4. **Be concise but complete:**
   - Provide summary statistics at the top
   - Include detailed breakdown in sections
   - Use collapsible sections if output is very long

5. **Sort data meaningfully:**
   - Collections alphabetically or by field count
   - Relationships by source collection
   - Types by frequency (most common first)

## Example Output

Here's what the output should look like for a small schema:

```markdown
# MongoDB Compass Schema Analysis

**Database**: mydb
**File**: export.json
**Analysis Date**: 2026-02-26

---

## Summary Statistics

- **Total Collections**: 3
- **Total Relationships**: 2
- **Total Fields**: 12
- **Average Fields per Collection**: 4.0

---

## Validation Results

✓ Schema structure is valid
✓ All BSON types are recognized
✓ All relationships reference existing collections
✓ No critical issues found

---

## Collections Overview

| Collection | Fields | Required | Relationships |
|------------|--------|----------|---------------|
| user       | 4      | 2        | 2             |
| post       | 5      | 3        | 1             |
| comment    | 3      | 2        | 1             |

---

## Relationship Map

| From | To | Type | Fields | Inferred |
|------|----|----- |--------|----------|
| post → user | Many-to-One | author_id → _id | No |
| comment → post | Many-to-One | post_id → _id | No |

---

## Type Distribution

- string: 7 fields (58.3%)
- objectId: 4 fields (33.3%)
- date: 1 field (8.3%)

---

## Collections Detail

### user

- **Namespace**: mydb.user
- **Fields**: 4
- **Required Fields**: _id, email

**Schema**:
- `_id`: objectId
- `email`: string
- `username`: string
- `created_at`: date

**Relationships**:
- Referenced by: post (author_id)

### post

- **Namespace**: mydb.post
- **Fields**: 5
- **Required Fields**: _id, title, author_id

**Schema**:
- `_id`: objectId
- `title`: string
- `content`: string
- `author_id`: objectId
- `published_at`: date

**Relationships**:
- References: user (author_id)
- Referenced by: comment (post_id)

### comment

- **Namespace**: mydb.comment
- **Fields**: 3
- **Required Fields**: _id, post_id

**Schema**:
- `_id`: objectId
- `post_id`: objectId
- `text`: string

**Relationships**:
- References: post (post_id)

---

## Issues & Recommendations

### Warnings

1. ⚠️ Collection `comment` has no required field for text content
2. ⚠️ Consider making essential fields required

### Suggestions

1. ℹ️ Add indexes on foreign key fields: `post.author_id`, `comment.post_id`
2. ℹ️ Consider adding timestamps (created_at, updated_at) to all collections

---

*Generated by MongoDB Compass Parser Skill*
```

## Notes

- This skill is **read-only** and will not modify any files
- Analysis typically completes in under 10 seconds for schemas with 100+ collections
- The skill can handle nested objects of any depth
- Relationships with complex field paths (multiple levels) are fully supported
- If the export file is very large (1000+ collections), consider processing in batches

## Testing

To test this skill, use the provided sample file:

```
/mongodb-compass-parser demoparser-db_23_02_2026.json
```

This file contains 21 collections and 25 relationships, providing a comprehensive test case.