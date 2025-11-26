# Notification System Testing Guide

This guide explains how to test the notification system using the provided test scripts.

## Test Scripts

### 1. `test-notification-system.js` - Interactive Database Testing

An interactive CLI tool for testing notifications directly in the database.

#### Features:

- List all users
- Create single or bulk notifications
- View notifications for any user
- Mark notifications as read/unread
- Delete notifications
- Get unread counts
- Create test users and posts

#### Usage:

```bash
# Install dependencies if needed
npm install mongoose readline

# IMPORTANT: The test scripts use CommonJS, but your project uses ES modules
# Option 1: Rename to .cjs extension
mv test-notification-system.js test-notification-system.cjs
node test-notification-system.cjs

# Option 2: Use the npm script (recommended)
npm run test:notifications:interactive

# Or with custom MongoDB URI
MONGODB_URI=mongodb://your-uri npm run test:notifications:interactive
```

**Note**: If you get an error about ES modules, rename the file from `.js` to `.cjs`.

#### Workflow:

1. **Option 9**: Create test users and posts first
2. **Option 1**: List all users to see their IDs
3. **Option 2 or 3**: Create notifications (single or bulk)
4. **Option 4**: View notifications for a user
5. **Option 8**: Check unread count
6. **Option 5**: Mark as read
7. **Option 6**: Delete notification
8. **Option 7**: Clear all notifications for a user

---

### 2. `test-notification-api.js` - Automated API Testing

Automated script that tests all notification API endpoints.

#### Features:

- Tests all notification API routes
- Simulates user interactions (login, post, like, comment, follow)
- Verifies notification creation
- Tests mark as read/delete operations
- Tests filtering and pagination

#### Usage:

```bash
# Make sure server is running first
npm run server  # In another terminal

# Run the automated tests (recommended)
npm run test:notifications

# Or run directly (may need .cjs extension)
node test-notification-api.js

# Or with custom base URL
BASE_URL=http://localhost:3003 npm run test:notifications
```

**Note**: If you get an error about ES modules, rename the file from `.js` to `.cjs`.

#### Prerequisites:

You need to have test users created in your database:

- Username: `testuser1`, Password: `test123`
- Username: `testuser2`, Password: `test123`

These users should already exist in your database. If not, create them using the interactive script (Option 9) or register manually.

---

## Testing Checklist

### Backend Tests

- [ ] **Notification Creation**

  - [ ] Like notification created when user likes a post
  - [ ] Comment notification created when user comments
  - [ ] Reply notification created when user replies
  - [ ] Repost notification created when user reposts
  - [ ] Quote notification created when user quotes
  - [ ] Follow notification created when user follows

- [ ] **Notification Retrieval**

  - [ ] GET /api/notifications returns notifications
  - [ ] Pagination works correctly
  - [ ] Filter by type works (like, comment, follow, etc.)
  - [ ] Filter by unread works
  - [ ] GET /api/notifications/unread-count returns correct count

- [ ] **Notification Operations**

  - [ ] PATCH /api/notifications/:id/read marks as read
  - [ ] PATCH /api/notifications/mark-all-read marks all as read
  - [ ] DELETE /api/notifications/:id deletes notification
  - [ ] Unread count updates correctly after operations

- [ ] **Notification Queue**

  - [ ] Notifications are queued properly
  - [ ] Queue is persisted to database
  - [ ] Failed notifications can be retried
  - [ ] Queue processes notifications correctly

- [ ] **Socket.io Integration**
  - [ ] Notifications are emitted via Socket.io
  - [ ] Unread count is sent with notification
  - [ ] Only recipient receives the notification

### Frontend Tests

- [ ] **Notification Bell**

  - [ ] Bell icon appears in both navigation bars (logged-in users)
  - [ ] Badge shows unread count
  - [ ] Badge displays "99+" for count > 99
  - [ ] Badge disappears when count = 0
  - [ ] Clicking bell toggles dropdown

- [ ] **Notification Dropdown**

  - [ ] Dropdown opens/closes correctly
  - [ ] Shows loading state while fetching
  - [ ] Shows empty state when no notifications
  - [ ] Displays recent 10 notifications
  - [ ] "Mark all as read" button works
  - [ ] "View all notifications" link navigates to page
  - [ ] Closes on click outside
  - [ ] Closes on Escape key

- [ ] **Notification Items**

  - [ ] Correct icon for each notification type
  - [ ] Correct color for each notification type
  - [ ] Shows actor username
  - [ ] Shows relative time (2m ago, 1h ago, etc.)
  - [ ] Unread indicator (dot) shows for unread
  - [ ] Clicking marks as read
  - [ ] Clicking navigates to correct page
  - [ ] Delete button appears on hover

- [ ] **Notifications Page**

  - [ ] Page loads at /notifications route
  - [ ] Filter tabs work correctly
  - [ ] Unread count badge on "Unread" tab
  - [ ] "Mark all as read" button works
  - [ ] "Load more" pagination works
  - [ ] Empty states show for each filter
  - [ ] Delete button works on full page
  - [ ] Mobile responsive

- [ ] **Real-time Updates**

  - [ ] New notifications appear in real-time
  - [ ] Unread count updates in real-time
  - [ ] Bell badge updates in real-time
  - [ ] Dropdown refreshes when new notification arrives

- [ ] **State Management**
  - [ ] Unread count loads on login
  - [ ] Unread count loads on session restore
  - [ ] Notifications reset on logout
  - [ ] Vuex store updates correctly

---

## Manual Testing Scenarios

### Scenario 1: Like Notification

1. Login as User A
2. Create a post
3. Login as User B (different browser/incognito)
4. Like User A's post
5. **Verify**: User A receives real-time notification
6. **Verify**: Bell badge increments
7. **Verify**: Notification appears in dropdown
8. Click notification
9. **Verify**: Marked as read
10. **Verify**: Badge count decrements

### Scenario 2: Comment Notification

1. Login as User A
2. Create a post
3. Login as User B
4. Comment on User A's post
5. **Verify**: User A receives notification
6. Click notification
7. **Verify**: Navigates to post/social page

### Scenario 3: Follow Notification

1. Login as User A
2. Login as User B
3. User B follows User A
4. **Verify**: User A receives notification
5. Click notification
6. **Verify**: Navigates to User B's profile

### Scenario 4: Mark All as Read

1. Login as User A with multiple unread notifications
2. Open dropdown
3. Click "Mark all as read"
4. **Verify**: All notifications marked as read
5. **Verify**: Badge disappears
6. **Verify**: Unread dots disappear

### Scenario 5: Notification Persistence

1. Login as User A
2. Receive notifications
3. Logout
4. Login again
5. **Verify**: Notifications still present
6. **Verify**: Unread count correct

---

## Troubleshooting

### Notifications not appearing?

1. Check MongoDB connection
2. Check Socket.io connection (browser console)
3. Verify NotificationQueueService is running
4. Check server logs for errors
5. Verify notification creation in database

### Badge not updating?

1. Check Socket.io event listeners in App.vue
2. Verify Vuex store mutations
3. Check browser console for errors
4. Verify `fetchUnreadCount` is called on login/mount

### Dropdown not closing?

1. Check event listeners are mounted
2. Verify click outside handler
3. Check dropdown ref is set correctly

### API errors?

1. Verify server is running
2. Check authentication tokens
3. Verify API routes are registered
4. Check middleware order

---

## Performance Testing

### Load Testing

Use the bulk notification creator to test with large datasets:

```bash
# Run interactive script
node test-notification-system.js

# Option 3: Create bulk notifications
# Enter recipient and create 1000+ notifications
```

Then test:

- [ ] Dropdown loads quickly with many notifications
- [ ] Full page handles pagination smoothly
- [ ] Filtering works with large datasets
- [ ] Database queries are optimized

### Real-time Testing

Test Socket.io with multiple users:

1. Open 5+ browser tabs with different users
2. Generate notifications for all users
3. Verify all receive updates in real-time
4. Check for memory leaks in long sessions

---

## Database Verification

Check notifications directly in MongoDB:

```javascript
// Connect to MongoDB
db.notifications.find({ recipient: ObjectId("USER_ID") }).pretty();

// Count unread
db.notifications.countDocuments({
  recipient: ObjectId("USER_ID"),
  read: false,
});

// Check TTL index exists
db.notifications.getIndexes();
// Should see: { "createdAt": 1 } with expireAfterSeconds: 2592000
```

---

## CI/CD Integration

Add to your test suite:

```json
// package.json
{
  "scripts": {
    "test:notifications": "node test-notification-api.js",
    "test:notifications:manual": "node test-notification-system.js"
  }
}
```

---

## Next Steps

After testing:

1. Monitor error logs for notification failures
2. Track notification delivery rates
3. Gather user feedback on UX
4. Optimize database queries if needed
5. Consider adding notification preferences
6. Implement push notifications (optional)

---

## Support

If you encounter issues:

1. Check server logs
2. Check browser console
3. Verify MongoDB connection
4. Review Socket.io connection status
5. Check notification queue status in database
