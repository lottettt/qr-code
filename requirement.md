# Centralized QR Code Center - System Requirements

## 1. Document Purpose

This document defines the functional and non-functional requirements for a **Centralized QR Code Center** used inside the factory.

The system will provide a single location for users to find, generate, download, and print QR codes that belong to different factory systems. It will also provide an administration function for maintaining systems, QR categories/types, QR items, and the values encoded in the QR codes.

The main principle is:

> Normal users should not need to know or manually enter the URL or data contained inside a QR code. They should only select the system and the QR item they need.

---

## 2. Background

The factory uses multiple software systems. Many of these systems are accessed or operated through QR codes.

Each system may have multiple kinds of QR codes depending on:

- business purpose
- production line
- station or position
- machine or equipment
- process
- dashboard or application page
- physical installation location

Currently, QR codes may be created and maintained separately by each system owner. This makes it difficult for users to find the correct QR code and for administrators to maintain, update, and reprint existing QR codes.

The business unit therefore requires one centralized system to manage QR codes for multiple factory applications.

---

## 3. Objective

The system shall:

1. Provide a centralized repository for QR codes used by factory systems.
2. Allow users to find QR codes by selecting a system and the required QR item.
3. Generate and display the QR code automatically from stored QR configuration.
4. Allow users to download or print the QR code.
5. Allow authorized administrators to register and manage systems and QR items.
6. Maintain ownership, status, and history of QR records.
7. Prevent normal users from needing to manually enter QR URLs or QR content.
8. Support future expansion as more factory systems are added.

---

## 4. Scope

### 4.1 In Scope

- Central QR Code web portal
- System registration
- QR type/category management
- QR item registration
- QR content/value management
- QR code generation
- QR code preview
- QR code download
- QR code printing
- Search and filtering
- QR status management
- User access control
- Audit history
- Basic duplicate checking
- Support for QR items associated with production locations

### 4.2 Out of Scope for Initial Release

The following are not required for the first release but should be considered for future implementation:

- QR scan analytics
- automatic synchronization with all external systems
- automatic discovery of QR values from other systems
- production-line layout visualization
- automatic broken-link monitoring
- mobile application
- advanced label designer

---

## 5. User Roles

### 5.1 Viewer

The Viewer can:

- access the QR Code Center
- search systems
- select QR items
- view generated QR codes
- download QR codes

The Viewer cannot:

- register systems
- create QR items
- modify QR content
- activate or deactivate QR items

### 5.2 Operator

The Operator can perform all Viewer functions and can also:

- print QR codes
- reprint existing QR codes

### 5.3 Administrator

The Administrator can:

- register systems
- edit system information
- create QR types/categories
- create QR items
- edit QR items
- configure QR values or URLs
- activate/deactivate QR items
- manage printing information
- view audit history

### 5.4 System Administrator

The System Administrator can perform all Administrator functions and can also:

- manage users
- manage roles and permissions
- manage system configuration

---

## 6. High-Level User Flow

```text
User needs a QR code
        |
        v
Open QR Code Center
        |
        v
Select System
        |
        v
Select QR Item / Content / Position
        |
        v
System retrieves QR configuration
        |
        v
Generate QR image
        |
        v
Display QR code
        |
        +----> Download
        |
        +----> Print
        |
        v
End
```

---

## 7. Functional Requirements

## FR-01 - Access QR Code Center

The system shall provide a web-based QR Code Center accessible through a standard web browser inside the factory network.

---

## FR-02 - Display Registered Systems

The system shall display all active systems that have QR codes available for users.

Example:

- e-WSL
- Matrack
- Maintenance System
- Production Monitoring
- Quality System

Inactive systems shall not be shown to normal users.

---

## FR-03 - System Sorting

The system shall display system names in a consistent order.

Default order:

```text
A -> Z
```

Administrators may define a custom display order in the future.

---

## FR-04 - Search Systems

Users shall be able to search registered systems by system name.

The search should work without requiring an exact match.

---

## FR-05 - Select System

The user shall be able to select one system.

After selection, the application shall display only the QR types/items associated with the selected system.

---

## FR-06 - QR Type / Category Management

A registered system may contain one or more QR types/categories.

Examples:

### Production System

- Position
- Station
- Dashboard
- Work Instruction

### Maintenance System

- Repair Request
- Equipment History
- PM Checklist

Administrators shall be able to create, update, activate, and deactivate QR types.

---

## FR-07 - Dynamic Display Label

The system should allow each QR type to define the label displayed to users.

Example:

```text
Type Name: Production Position
Display Label: Position
```

Another system may use:

```text
Type Name: Equipment
Display Label: Machine
```

This prevents the user interface from forcing all systems to use the same terminology.

---

## FR-08 - Display QR Items

After selecting a system or QR type, the system shall display all active QR items associated with the selection.

Example:

```text
System: e-WSL

Position 1
Position 2
Position 3
```

---

## FR-09 - Search QR Items

Users shall be able to search QR items within the selected system.

Searchable information should include, where applicable:

- item name
- production line
- station
- machine
- position
- description

---

## FR-10 - Select QR Item

The user shall be able to select one QR item.

After selection, the system shall retrieve the QR configuration stored for that item.

---

## FR-11 - QR Item Registration

Authorized administrators shall be able to register a QR item.

Each QR item should contain, where applicable:

- QR Item ID
- Item Name
- System
- QR Type
- QR Value / QR Content
- Target URL
- Description
- Business Unit
- Factory
- Production Line
- Area
- Process
- Station
- Machine / Equipment
- Position
- Physical Location
- Status
- Created By
- Created Date
- Updated By
- Updated Date

Not all location fields shall be mandatory.

Required fields may depend on QR type.

---

## FR-12 - QR Value Management

The system shall store the source value used to generate each QR code.

The source value may be:

- URL
- text
- identifier
- system-specific value

Example:

```text
https://system2.factory.local/position/1
```

The system should store this value instead of depending only on a stored QR image.

---

## FR-13 - Generate QR Code

When a user selects a QR item, the system shall generate a QR image from the configured QR value.

The generated QR code shall represent the configured value accurately.

---

## FR-14 - QR Preview

The system shall display a preview of the selected QR code.

The preview should show:

- QR image
- system name
- QR type or display label
- QR item name
- additional location information when applicable

Example:

```text
System 2 > Position 1

[ QR CODE ]
```

---

## FR-15 - Download QR Code

Users with permission shall be able to download the generated QR code.

Recommended formats:

- PNG
- SVG
- PDF

At minimum, the first release shall support PNG.

---

## FR-16 - Print QR Code

Users with print permission shall be able to print the selected QR code.

The system should support a standard print layout containing:

- system name
- QR item name
- QR code
- QR ID
- optional location information

---

## FR-17 - Reprint Existing QR Code

Users shall be able to search for and reprint an existing QR code without creating a new QR item.

This supports cases where the physical label is damaged or lost.

---

## FR-18 - System Registration

Authorized administrators shall be able to register a new system.

System information should include:

- System ID
- System Name
- Description
- System Owner
- Contact Team / Contact Person
- Base URL, if applicable
- Status
- Created Date
- Updated Date

---

## FR-19 - QR Status Management

Each QR item shall have a status.

Recommended statuses:

- Draft
- Active
- Inactive
- Replaced
- Deprecated

Only Active QR items shall normally be visible to standard users.

---

## FR-20 - Activate / Deactivate QR Item

Authorized administrators shall be able to activate or deactivate QR items.

Deactivating a QR item shall not permanently delete its historical record.

---

## FR-21 - Replace QR Item

The system should allow an administrator to replace an existing QR item when necessary.

Examples:

- destination URL changed
- system migrated
- position changed
- QR format changed

The system should maintain the relationship between the previous QR item and the replacement QR item.

---

## FR-22 - Duplicate Detection

The system shall check for possible duplicate QR items during registration.

Possible duplicate criteria may include:

- same system and QR type
- same item name
- same target URL
- same system and location
- same system, line, and position

When a possible duplicate is detected, the system shall notify the administrator.

The business unit shall decide whether duplicate conditions are warning-only or hard-block conditions.

---

## FR-23 - URL Validation

When the QR value is a URL, the system shall validate the URL format before saving.

The system should reject clearly invalid URL formats.

Example invalid value:

```text
htp://production
```

---

## FR-24 - Location Information

The system shall allow a QR item to be associated with physical factory location information.

Possible fields:

- Factory
- Building
- Floor
- Production Line
- Process
- Station
- Machine
- Position
- Installation Note

Example:

```text
Factory: Factory A
Line: Line 2
Station: ST-05
Position: Operator Monitor - Left Side
```

---

## FR-25 - Unique QR Item ID

Each QR item shall have a unique identifier.

Example:

```text
QR-000001
QR-000002
QR-000003
```

The identifier shall remain unique even if the QR item is later deactivated.

---

## FR-26 - Audit Log

The system shall record important administrative actions.

The audit log should include:

- date/time
- user
- action
- affected record
- previous value, where applicable
- new value, where applicable

Events should include:

- system created
- system updated
- QR type created
- QR item created
- QR value changed
- QR activated
- QR deactivated
- QR replaced

Optional future events:

- QR downloaded
- QR printed

---

## FR-27 - Access Control

The system shall enforce permissions according to assigned user roles.

Normal users shall not be allowed to modify QR definitions.

Only authorized administrators shall be able to change QR values.

---

## FR-28 - Error Handling

The system shall provide understandable error messages when an operation fails.

The message should include:

1. what failed
2. the likely symptom or cause when known
3. what the user should do next

Example:

```text
QR code could not be generated because the configured QR value is invalid.
Please contact the system administrator or correct the QR configuration.
```

The system should avoid displaying raw technical stack traces to normal users.

---

## FR-29 - Hard Block for Invalid Configuration

The system shall not allow a QR item to become Active when mandatory configuration is missing or invalid.

Examples:

- QR value is empty
- related system does not exist
- QR type is inactive
- required field for the selected QR type is missing

The user shall be informed what must be corrected before activation.

---

## FR-30 - QR Generation Failure Recovery

If QR generation fails, the system shall:

1. notify the user that generation failed
2. keep the registered QR item unchanged
3. provide a retry option where appropriate
4. log the technical failure for troubleshooting

---

## 8. Business Rules

### BR-01

Every QR item shall belong to one registered system.

### BR-02

Every QR item shall belong to one QR type/category.

### BR-03

Every QR item shall have a unique QR Item ID.

### BR-04

Normal users shall not manually enter or modify QR values.

### BR-05

Only active QR items shall be displayed in the standard user selection screen.

### BR-06

A QR item that has already been used in production should not normally be permanently deleted.

### BR-07

Historical QR records should be retained for traceability.

### BR-08

Changing metadata such as description or location shall not automatically change the QR encoded value unless explicitly updated.

### BR-09

Downloading or printing a QR code shall not create a new QR item.

### BR-10

Reprinting an existing QR shall reproduce the same QR value unless the QR item has officially been replaced.

### BR-11

A QR type may define different mandatory fields from another QR type.

Example:

```text
Type: Position
Required: Production Line + Position

Type: Machine
Required: Machine ID
```

### BR-12

The system should treat QR configuration and the printed physical label as separate concepts.

One QR definition may be printed more than once.

---

## 9. User Interface Requirements

## UI-01 - Main User Screen

The main user screen shall contain three main areas:

```text
+---------------------------------------------------------------+
| QR Code Center                                                |
+---------------------+---------------------+-------------------+
| Select System       | Select QR Item      | QR Preview        |
|                     |                     |                   |
| System 1            | Position 1          |   [ QR CODE ]     |
| System 2            | Position 2          |                   |
| System 3            | Position 3          | Download / Print  |
|                     |                     |                   |
+---------------------+---------------------+-------------------+
```

---

## UI-02 - System Selection

The system list shall:

- show active systems only
- support alphabetical sorting
- clearly indicate the selected system
- support search when the number of systems becomes large

---

## UI-03 - QR Item Selection

The QR item list shall:

- show only items related to the selected system/type
- clearly indicate the selected item
- support search
- support alphabetical or configured ordering

---

## UI-04 - QR Preview Area

The QR preview area shall show the currently selected path.

Example:

```text
System 2 > Position 1
```

and display the generated QR code below it.

---

## UI-05 - Simple User Experience

The normal user interface should hide technical information that is not required for QR retrieval.

The following should normally not be shown to standard users:

- database IDs
- internal configuration
- raw URL editing controls
- system administration controls

---

## 10. Data Model - Conceptual

```text
System
  |
  +---- QR Type
          |
          +---- QR Item
                  |
                  +---- Location Information
                  |
                  +---- QR Value
                  |
                  +---- Audit History
```

### 10.1 System

```text
system_id
system_name
description
system_owner
contact
base_url
status
created_at
updated_at
```

### 10.2 QR Type

```text
qr_type_id
system_id
type_name
display_label
description
status
created_at
updated_at
```

### 10.3 QR Item

```text
qr_item_id
qr_type_id
item_name
qr_value
description
business_unit
factory
production_line
area
process
station
machine
position
physical_location
status
created_by
created_at
updated_by
updated_at
```

### 10.4 Audit Log

```text
audit_id
user_id
action
entity_type
entity_id
old_value
new_value
created_at
```

---

## 11. Non-Functional Requirements

## NFR-01 - Availability

The application should be available during factory operating hours according to the business unit's required service level.

---

## NFR-02 - Performance

The main system list should normally load within 3 seconds under standard internal network conditions.

QR preview generation should normally complete within 2 seconds after the QR item is selected.

---

## NFR-03 - Security

The system shall require authenticated access unless the business unit explicitly approves anonymous internal access.

Administrative functions shall require appropriate authorization.

---

## NFR-04 - Traceability

Changes to important QR configuration shall be traceable to the responsible user and timestamp.

---

## NFR-05 - Maintainability

The system shall allow additional factory systems and QR types to be added without changing application source code for each new system.

---

## NFR-06 - Browser Support

The system should support the standard browser used in the factory environment.

At minimum, the application should be tested with the organization-approved version of Microsoft Edge or Chrome.

---

## NFR-07 - Data Integrity

The application shall protect against incomplete or invalid QR configuration being activated.

---

## NFR-08 - Backup

QR configuration and master data should be included in the standard application/database backup process.

---

## 12. MVP Scope

The first release should include:

1. User authentication
2. Role-based access control
3. System registration
4. QR type registration
5. QR item registration
6. QR value configuration
7. System selection
8. QR item selection
9. QR code generation
10. QR preview
11. PNG download
12. Basic print support
13. Search and filtering
14. QR activation/deactivation
15. Audit history for configuration changes
16. Basic duplicate detection
17. Basic URL validation

---

## 13. Future Enhancements

Potential future enhancements include:

- CSV/Excel bulk import
- bulk QR generation
- multiple print templates
- SVG/PDF export
- external API for QR registration
- integration with factory master data
- scan statistics
- QR usage history
- automatic URL health checking
- approval workflow before QR activation
- production line map view
- QR label size configuration
- multi-language support

---

## 14. Future API Concept

The system should be designed so that other factory systems can integrate with the QR Code Center in the future.

Example API operations:

```text
POST /api/qr-items
GET  /api/qr-items/{id}
GET  /api/qr-items
PUT  /api/qr-items/{id}
POST /api/qr-items/{id}/activate
POST /api/qr-items/{id}/deactivate
GET  /api/qr-items/{id}/image
```

External APIs are not mandatory for the MVP unless specifically requested by the business unit.

---

## 15. Example Use Case

### UC-01 - User Retrieves a QR Code

**Actor:** Viewer / Operator

**Precondition:**

- user can access the QR Code Center
- target system and QR item are Active

**Main Flow:**

1. User opens the QR Code Center.
2. System displays active systems.
3. User selects `System 2`.
4. System displays QR items related to System 2.
5. User selects `Position 1`.
6. System retrieves the QR value configured for Position 1.
7. System generates the QR image.
8. System displays `System 2 > Position 1` and the QR image.
9. User downloads or prints the QR code.
10. Use case ends.

**Exception Flow:**

If QR generation fails:

1. System displays an understandable error.
2. Existing QR configuration is not modified.
3. User may retry.
4. Technical error is logged.

---

## 16. Example Admin Use Case

### UC-02 - Register a New QR Item

**Actor:** Administrator

**Main Flow:**

1. Administrator opens the administration page.
2. Administrator selects a registered system.
3. Administrator selects or creates a QR type.
4. Administrator enters the QR item name.
5. Administrator enters the QR value or URL.
6. Administrator enters applicable location information.
7. System validates required fields.
8. System checks for possible duplicates.
9. Administrator saves the QR item.
10. QR item is created as Draft or Active according to the configured workflow.
11. System records the action in the audit log.

---

## 17. Acceptance Criteria for Initial Release

The MVP shall be considered functionally ready when the following can be demonstrated:

1. An administrator can register a new system.
2. An administrator can create a QR type under that system.
3. An administrator can create a QR item and define its QR value.
4. A normal user can select the system from the QR Code Center.
5. A normal user can select the QR item.
6. The system generates and displays the correct QR code.
7. The generated QR can be scanned and returns the configured value.
8. The user can download the QR image.
9. An authorized user can print/reprint the QR.
10. Inactive QR items are hidden from normal users.
11. Unauthorized users cannot change QR configuration.
12. Important configuration changes are recorded in the audit log.
13. Invalid mandatory configuration cannot be activated.

---

## 18. Open Business Decisions

The following items should be confirmed with the business unit before implementation:

1. Should QR items require an approval workflow before becoming Active?
2. Which QR formats are required at launch: PNG only, or PNG/SVG/PDF?
3. Is printing through the browser sufficient, or is direct label-printer integration required?
4. Which location fields are mandatory?
5. Should duplicate QR detection warn the user or hard block creation?
6. Should normal users be allowed to see the raw QR URL/value?
7. Is user authentication connected to company SSO/Active Directory?
8. Is audit logging of every download and print required?
9. Should the system support bulk import in the first release?
10. Should each system owner be allowed to administer only their own system, or can all administrators manage all systems?

---

## 19. Summary

The Centralized QR Code Center will act as the factory's central repository for QR definitions used by multiple software systems.

Normal users will follow a simple flow:

```text
Select System -> Select QR Item -> View QR -> Download / Print
```

Administrators will maintain the configuration behind the QR codes:

```text
System -> QR Type -> QR Item -> QR Value -> Status / Location
```

This separation keeps the user experience simple while providing centralized control, traceability, and maintainability for the business unit.
