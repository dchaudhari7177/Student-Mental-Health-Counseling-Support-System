# Database Enhancements - Triggers, Procedures & Functions

This document describes the advanced database features implemented for the SMHCSS project including triggers, stored procedures, and functions.

## 📊 Overview

The database enhancements add:
- **3 Enhancement Tables** for tracking statistics and history
- **4 Stored Procedures** for complex operations
- **4 Functions** for calculations and validations
- **5 Triggers** for automatic data management

## 🚀 Installation

Run the enhancement script to install all database objects:

```bash
node lib/db-enhancements.js
```

This will:
1. Create necessary tables
2. Install all stored procedures
3. Install all functions
4. Install all triggers
5. Initialize statistics from existing data

## 📁 New Database Tables

### 1. APPOINTMENT_HISTORY
Tracks all appointment status changes for audit purposes.

| Column | Type | Description |
|--------|------|-------------|
| history_id | INT | Primary key |
| appointment_id | INT | Reference to appointment |
| old_status | VARCHAR(50) | Previous status |
| new_status | VARCHAR(50) | New status |
| changed_at | TIMESTAMP | When the change occurred |

### 2. COUNSELOR_STATS
Maintains real-time statistics for each counselor.

| Column | Type | Description |
|--------|------|-------------|
| counselor_id | INT | Primary key, FK to COUNSELOR |
| total_appointments | INT | Total appointments count |
| completed_sessions | INT | Completed sessions count |
| cancelled_appointments | INT | Cancelled appointments count |
| average_rating | DECIMAL(3,2) | Average rating from feedback |
| total_ratings | INT | Number of ratings received |
| last_updated | TIMESTAMP | Last update time |

### 3. STUDENT_ACTIVITY
Tracks student engagement and activity.

| Column | Type | Description |
|--------|------|-------------|
| student_id | INT | Primary key, FK to STUDENT |
| total_appointments | INT | Total appointments booked |
| completed_sessions | INT | Completed sessions |
| cancelled_appointments | INT | Cancelled appointments |
| last_appointment_date | DATE | Date of last appointment |
| last_updated | TIMESTAMP | Last update time |

## 🔧 Stored Procedures

### 1. GetCounselorPerformance
Get comprehensive performance statistics for a counselor.

**Syntax:**
```sql
CALL GetCounselorPerformance(counselor_id);
```

**Example:**
```sql
CALL GetCounselorPerformance(1);
```

**API Endpoint:**
```
GET /api/counselor/performance?counselorId=1
```

**Returns:**
- Counselor details (name, email, specialization)
- Total appointments
- Completed sessions
- Cancelled appointments
- Average rating
- Total ratings
- Availability status

---

### 2. GetStudentHistory
Get complete appointment history for a student with all details.

**Syntax:**
```sql
CALL GetStudentHistory(student_id);
```

**Example:**
```sql
CALL GetStudentHistory(1);
```

**API Endpoint:**
```
GET /api/student/history?studentId=1
```

**Returns:**
- All appointments with dates and times
- Counselor names and specializations
- Session notes (if completed)
- Feedback and ratings
- Follow-up requirements

---

### 3. BookAppointmentWithValidation
Book an appointment with automatic validation of slot availability and counselor status.

**Syntax:**
```sql
CALL BookAppointmentWithValidation(student_id, counselor_id, date, time, mode, @result);
SELECT @result;
```

**Example:**
```sql
CALL BookAppointmentWithValidation(1, 2, '2025-12-01', '10:00:00', 'Online', @result);
SELECT @result;
```

**API Endpoint:**
```
POST /api/appointments/validate
{
  "student_id": 1,
  "counselor_id": 2,
  "appointment_date": "2025-12-01",
  "appointment_time": "10:00:00",
  "mode": "Online"
}
```

**Validations:**
- Checks if counselor is available
- Validates slot is not already booked
- Returns success with appointment ID or error message

---

### 4. CompleteAppointmentWithSession
Complete an appointment and create a session record in one transaction.

**Syntax:**
```sql
CALL CompleteAppointmentWithSession(appointment_id, start_time, end_time, notes, follow_up, @result);
SELECT @result;
```

**Example:**
```sql
CALL CompleteAppointmentWithSession(
  1, 
  '2025-11-16 10:00:00', 
  '2025-11-16 11:00:00', 
  'Patient showed improvement', 
  TRUE, 
  @result
);
SELECT @result;
```

**API Endpoint:**
```
POST /api/sessions/complete
{
  "appointment_id": 1,
  "start_time": "2025-11-16T10:00:00",
  "end_time": "2025-11-16T11:00:00",
  "notes": "Patient showed improvement",
  "follow_up_required": true
}
```

**Actions:**
- Validates appointment is in 'Confirmed' status
- Updates appointment status to 'Completed'
- Creates session record automatically
- Updates student statistics

## 📐 Functions

### 1. CalculateCounselorRating
Calculate the average rating for a counselor.

**Syntax:**
```sql
SELECT CalculateCounselorRating(counselor_id) as rating;
```

**Example:**
```sql
SELECT CalculateCounselorRating(1) as rating;
```

**API Endpoint:**
```
GET /api/stats/functions?type=counselor-rating&id=1
```

**Returns:** DECIMAL(3,2) - Average rating (0.00 to 5.00)

---

### 2. GetStudentSessionCount
Get total number of completed sessions for a student.

**Syntax:**
```sql
SELECT GetStudentSessionCount(student_id) as session_count;
```

**Example:**
```sql
SELECT GetStudentSessionCount(1) as session_count;
```

**API Endpoint:**
```
GET /api/stats/functions?type=student-sessions&id=1
```

**Returns:** INT - Number of sessions

---

### 3. IsAppointmentSlotAvailable
Check if a specific time slot is available for booking.

**Syntax:**
```sql
SELECT IsAppointmentSlotAvailable(counselor_id, date, time) as available;
```

**Example:**
```sql
SELECT IsAppointmentSlotAvailable(1, '2025-12-01', '10:00:00') as available;
```

**Returns:** BOOLEAN - TRUE if available, FALSE if booked

---

### 4. GetCounselorAvailableSlots
Get the number of available slots for a counselor on a specific date.

**Syntax:**
```sql
SELECT GetCounselorAvailableSlots(counselor_id, date) as available_slots;
```

**Example:**
```sql
SELECT GetCounselorAvailableSlots(1, '2025-12-01') as available_slots;
```

**Returns:** INT - Number of available slots (assuming 8 slots per day)

## ⚡ Triggers

### 1. after_appointment_insert
**Purpose:** Track new appointments and update statistics

**Fires:** After INSERT on APPOINTMENT table

**Actions:**
- Creates/updates entry in COUNSELOR_STATS
- Creates/updates entry in STUDENT_ACTIVITY
- Increments total_appointments count

---

### 2. after_appointment_update
**Purpose:** Log all appointment status changes

**Fires:** After UPDATE on APPOINTMENT table

**Actions:**
- Inserts record into APPOINTMENT_HISTORY when status changes
- Maintains complete audit trail

---

### 3. before_appointment_update
**Purpose:** Update statistics when appointment status changes

**Fires:** Before UPDATE on APPOINTMENT table

**Actions:**
- When status changes to 'Completed':
  - Increments completed_sessions in COUNSELOR_STATS
  - Updates STUDENT_ACTIVITY
- When status changes to 'Cancelled':
  - Increments cancelled_appointments counts

---

### 4. after_session_insert
**Purpose:** Update student session counts

**Fires:** After INSERT on SESSION table

**Actions:**
- Increments total_sessions in STUDENT table
- Updates last_session_date

---

### 5. after_feedback_insert
**Purpose:** Automatically update counselor ratings

**Fires:** After INSERT on FEEDBACK table

**Actions:**
- Recalculates average_rating for counselor
- Updates total_ratings count in COUNSELOR_STATS

## 🔍 Usage Examples

### Example 1: Book Appointment with Validation

```javascript
// Frontend code
const response = await fetch('/api/appointments/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    student_id: 1,
    counselor_id: 2,
    appointment_date: '2025-12-01',
    appointment_time: '10:00:00',
    mode: 'Online'
  })
});

const result = await response.json();
// Returns: { message: "Appointment booked successfully", details: "..." }
// Or: { error: "Time slot already booked" }
```

### Example 2: Check Slot Availability

```javascript
// Check if a specific slot is available
const response = await fetch(
  '/api/appointments/validate?counselorId=2&date=2025-12-01&time=10:00:00'
);

const data = await response.json();
// Returns: { slotAvailable: true, availableSlotsForDay: 5 }
```

### Example 3: Get Counselor Performance

```javascript
// Get comprehensive counselor statistics
const response = await fetch('/api/counselor/performance?counselorId=2');
const stats = await response.json();

console.log(stats);
// Returns:
// {
//   counselor_id: 2,
//   name: "Dr. Jane Smith",
//   specialization: "Anxiety Disorders",
//   total_appointments: 45,
//   completed_sessions: 38,
//   cancelled_appointments: 3,
//   average_rating: 4.75,
//   total_ratings: 32,
//   available: true
// }
```

### Example 4: Complete Appointment with Session

```javascript
// Complete an appointment and create session record
const response = await fetch('/api/sessions/complete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appointment_id: 15,
    start_time: '2025-11-16T10:00:00',
    end_time: '2025-11-16T11:00:00',
    notes: 'Patient showed significant improvement in managing anxiety',
    follow_up_required: true
  })
});

const result = await response.json();
// Returns: { message: "Appointment completed successfully", details: "..." }
```

## 📈 Benefits

### 1. Data Integrity
- Triggers ensure statistics are always up-to-date
- Automatic validation prevents double-booking
- Audit trail for all status changes

### 2. Performance
- Pre-calculated statistics reduce query complexity
- Functions encapsulate complex calculations
- Indexed tables for fast lookups

### 3. Business Logic
- Centralized validation in database
- Consistent behavior across all applications
- Reduced application code complexity

### 4. Auditing
- Complete history of all changes
- Track counselor performance over time
- Monitor student engagement patterns

## 🧪 Testing

### Test Trigger Functionality

```sql
-- Insert a new appointment (trigger fires)
INSERT INTO APPOINTMENT (student_id, counselor_id, appointment_date, appointment_time, mode)
VALUES (1, 2, '2025-12-01', '10:00:00', 'Online');

-- Check COUNSELOR_STATS was updated
SELECT * FROM COUNSELOR_STATS WHERE counselor_id = 2;

-- Update appointment status (trigger fires)
UPDATE APPOINTMENT SET status = 'Completed' WHERE appointment_id = LAST_INSERT_ID();

-- Check APPOINTMENT_HISTORY was created
SELECT * FROM APPOINTMENT_HISTORY ORDER BY changed_at DESC LIMIT 1;
```

### Test Stored Procedures

```sql
-- Test booking with validation
CALL BookAppointmentWithValidation(1, 2, '2025-12-01', '14:00:00', 'Online', @result);
SELECT @result;

-- Test getting counselor performance
CALL GetCounselorPerformance(2);

-- Test getting student history
CALL GetStudentHistory(1);
```

### Test Functions

```sql
-- Test counselor rating calculation
SELECT CalculateCounselorRating(2) as rating;

-- Test student session count
SELECT GetStudentSessionCount(1) as sessions;

-- Test slot availability
SELECT IsAppointmentSlotAvailable(2, '2025-12-01', '10:00:00') as available;

-- Test available slots count
SELECT GetCounselorAvailableSlots(2, '2025-12-01') as slots;
```

## 🔄 Maintenance

### Rebuild Statistics

If statistics get out of sync, run:

```sql
-- Recalculate counselor stats
UPDATE COUNSELOR_STATS cs
SET total_appointments = (
  SELECT COUNT(*) FROM APPOINTMENT WHERE counselor_id = cs.counselor_id
),
completed_sessions = (
  SELECT COUNT(*) FROM APPOINTMENT 
  WHERE counselor_id = cs.counselor_id AND status = 'Completed'
);

-- Recalculate student activity
UPDATE STUDENT_ACTIVITY sa
SET total_appointments = (
  SELECT COUNT(*) FROM APPOINTMENT WHERE student_id = sa.student_id
),
completed_sessions = (
  SELECT COUNT(*) FROM APPOINTMENT 
  WHERE student_id = sa.student_id AND status = 'Completed'
);
```

### View Trigger Status

```sql
SHOW TRIGGERS FROM smhcss_db;
```

### View Stored Procedures

```sql
SHOW PROCEDURE STATUS WHERE Db = 'smhcss_db';
```

### View Functions

```sql
SHOW FUNCTION STATUS WHERE Db = 'smhcss_db';
```

## ⚠️ Important Notes

1. **Transaction Safety**: All stored procedures use transactions to ensure data consistency
2. **Error Handling**: Procedures return descriptive error messages
3. **Backward Compatibility**: Existing API routes continue to work unchanged
4. **Performance**: Indexes are created on foreign keys for optimal performance
5. **Statistics**: Auto-updated by triggers, no manual maintenance needed

## 📚 Additional Resources

- Main README: [README.md](../README.md)
- Database Setup: [lib/db.js](../lib/db.js)
- Enhancement Script: [lib/db-enhancements.js](../lib/db-enhancements.js)
- API Documentation: See individual route files in `src/app/api/`

---

**Last Updated:** November 16, 2025
**Version:** 1.0.0
