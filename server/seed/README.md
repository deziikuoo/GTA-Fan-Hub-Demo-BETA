# Test Data Seed Scripts

Scripts to quickly populate your database with test users and follow relationships for development and testing.

## Quick Start

### One Command Setup (Recommended)

Create 10 test users with follow relationships:

```bash
node server/seed/setupTestData.js
```

Or specify number of users and password:

```bash
node server/seed/setupTestData.js 20 mypassword
```

## Individual Scripts

### 1. Create Test Users

Create test users with predictable usernames:

```bash
# Create 5 users (default)
node server/seed/createTestUsers.js

# Create 20 users
node server/seed/createTestUsers.js 20

# Create 10 users with custom password
node server/seed/createTestUsers.js 10 mypassword
```

**Creates:**

- `testuser1` / `testuser1@gtafanhub.test`
- `testuser2` / `testuser2@gtafanhub.test`
- `testuser3` / `testuser3@gtafanhub.test`
- etc.

**Default Password:** `test123`

### 2. Seed Follow Data

Create random follow relationships between existing test users:

```bash
node server/seed/seedFollowData.js
```

**What it does:**

- Each user follows 30-70% of other users randomly
- Creates mutual follows automatically
- Updates follower/following counts
- Sets random follow dates (last 90 days)

### 3. Complete Setup

Runs both scripts in sequence:

```bash
node server/seed/setupTestData.js [users] [password]
```

## Test User Details

Each generated user has:

### Basic Info

- **Username:** `testuser1`, `testuser2`, etc.
- **Email:** `testuser1@gtafanhub.test`
- **Password:** `test123` (or custom)

### Profile

- Display name: "Test User 1", "Test User 2", etc.
- Random bio from templates
- Random location (Los Santos, Vice City, etc.)
- 20% chance of verified badge
- Random join date (within last year)

### Gaming Profile

- Random favorite games
- Random play style (casual, competitive, etc.)
- Random skill level (beginner to expert)
- Random online status

### Social Stats

- Random post counts (0-100)
- Random likes (0-500)
- Random reputation (0-1000)
- Random level (1-50)

## Usage Examples

### For Manual Testing

1. **Create test data:**

   ```bash
   node server/seed/setupTestData.js 10
   ```

2. **Login to your app:**

   - Username: `testuser1`
   - Password: `test123`

3. **Test features:**
   - Visit `/profile/testuser2`
   - Click Follow button
   - View Followers/Following tabs
   - Check mutual followers

### For Automated Testing

1. **Create test data:**

   ```bash
   node server/seed/setupTestData.js 5
   ```

2. **Run test suite:**
   ```bash
   node test-follow-system.js
   ```

### For Load Testing

Create lots of users and relationships:

```bash
node server/seed/setupTestData.js 100
```

## Cleanup

To remove all test users:

```javascript
// In MongoDB shell or Compass
db.users.deleteMany({ username: /^testuser\d+$/ });
db.follows.deleteMany({ source: "seed" });
```

Or use MongoDB Compass to filter and delete:

- Filter: `{ username: /^testuser\d+$/ }`
- Select all → Delete

## Notes

- Scripts are **idempotent** - safe to run multiple times
- Existing users are skipped automatically
- All dates are randomized for realistic data
- Follow relationships are created randomly
- Mutual follows are detected automatically
- Counts are calculated accurately

## Troubleshooting

### "User already exists"

This is normal. Script skips existing users. Delete them first if you want fresh data.

### "Need at least 2 test users"

Run `createTestUsers.js` first before `seedFollowData.js`.

### "Connection error"

Make sure:

1. MongoDB is running
2. `.env` has correct `CONNECTION_STRING`
3. Server is not running (close it first)

## Production Warning

⚠️ **NEVER run these scripts in production!**

These scripts are for development/testing only. They create users with:

- Weak passwords
- Predictable usernames
- Email addresses in `.test` domain
- Random data

Always use proper user registration in production.
