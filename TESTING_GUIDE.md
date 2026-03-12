# QUICK TESTING GUIDE

## 🚀 How to Test the Fixes

### Step 1: Restart the Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Clear Browser Cache & Cookies
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Or use Incognito/Private window

### Step 3: Test Admin Login Flow

#### 3.1 Login as Admin
1. Navigate to `http://localhost:3000/login`
2. Login with Admin credentials
3. **Open Browser Console (F12 → Console)**
4. You should see logs like:
   ```
   [AUTH] Session validated: { userId: X, role: 'Admin', teamId: Y, hasTeam: true }
   [FILTER] Role normalized: { original: 'Admin', normalized: 'admin' }
   [FILTER] Team-based filter: { teamId: Y }
   ```

#### 3.2 Check Dashboard
1. Navigate to `/dashboard`
2. **Expected:** Dashboard loads with team-specific data
3. **Check Console:** Should see successful API calls
4. **No Errors:** No "Failed to fetch data" messages

#### 3.3 Check Masters (Courier Example)
1. Navigate to `/masters/courier`
2. **Expected:** List of couriers for your team
3. **Check Console:** Should see `[AUTH]` and `[FILTER]` logs
4. **No Errors:** No `.filter is not a function` errors

#### 3.4 Add New Courier
1. Click "Add Courier" button
2. Fill in form and submit
3. **Expected:** New courier appears immediately in the list
4. **No Refresh Needed:** Data updates without manual refresh

#### 3.5 Logout and Login Again
1. Logout
2. Login again with same Admin account
3. Navigate to `/dashboard`
4. **Expected:** All data still loads correctly
5. **No Empty State:** Dashboard shows same data as before

### Step 4: Test Clerk Login Flow

#### 4.1 Login as Clerk
1. Logout if logged in
2. Navigate to `http://localhost:3000/login`
3. Login with Clerk credentials
4. **Open Browser Console**
5. You should see:
   ```
   [AUTH] Session validated: { userId: X, role: 'Clerk', teamId: Y, hasTeam: true }
   ```

#### 4.2 Check Dashboard
1. Navigate to `/dashboard`
2. **Expected:** Dashboard loads successfully
3. **No "Failed to fetch data" error**
4. **Shows team data:** Inward/Outward counts for the team

#### 4.3 Check Masters
1. Navigate to `/masters/courier` (or any master)
2. **Expected:** List loads successfully
3. **Shows team data only**
4. **No authorization errors**

### Step 5: Verify Team Isolation

#### 5.1 Create Test Scenario
You need two users from different teams:
- Admin A from Team 1
- Admin B from Team 2

#### 5.2 Test Isolation
1. Login as Admin A (Team 1)
2. Note the data count in masters
3. Add a new courier
4. Logout
5. Login as Admin B (Team 2)
6. **Expected:** Different data set
7. **Should NOT see:** Team 1's courier you just added

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized - Please login again"
**Cause:** Session token expired or invalid
**Solution:** 
1. Clear cookies
2. Login again
3. Check console for `[AUTH]` logs

### Issue 2: Empty Dashboard After Login
**Cause:** teamId might be null in database
**Solution:**
1. Check console logs: `[AUTH] Session validated`
2. Verify `teamId` is present
3. If null, update user in database:
   ```sql
   UPDATE "User" SET "TeamID" = 1 WHERE "UserID" = X;
   ```

### Issue 3: ".filter is not a function"
**Cause:** API returned error object instead of array
**Solution:**
1. Check Network tab in DevTools
2. Look for 401 or 500 errors
3. Check console for error details
4. Verify session is valid

### Issue 4: Data Not Updating After Add
**Cause:** Frontend state not updating
**Solution:**
1. Check if API call succeeded (Network tab)
2. Verify response contains new record
3. Check console for errors
4. Try manual refresh to confirm data was saved

---

## 📊 What to Look For in Console

### Successful Login:
```
[AUTH] Session validated: { userId: 5, role: 'Admin', teamId: 2, hasTeam: true }
```

### Successful Data Fetch:
```
[FILTER] Role normalized: { original: 'Admin', normalized: 'admin' }
[FILTER] Team-based filter: { teamId: 2 }
```

### Failed Authentication:
```
[AUTH] No token found in cookies
```
or
```
[AUTH] Token verification failed: jwt expired
```

### No Session:
```
[FILTER] No session - returning empty filter
```

---

## 🔍 Debugging Checklist

If something doesn't work:

- [ ] Check browser console for `[AUTH]` logs
- [ ] Verify session has `teamId` (not null)
- [ ] Check Network tab for API responses
- [ ] Look for 401/500 status codes
- [ ] Verify cookies are set (Application tab)
- [ ] Check if token is valid (copy to jwt.io)
- [ ] Ensure database has correct TeamID for user
- [ ] Try clearing cache and cookies
- [ ] Try incognito/private window

---

## 📝 Expected Console Output (Full Flow)

### Login:
```
[AUTH] Session validated: { userId: 5, role: 'Admin', teamId: 2, hasTeam: true }
```

### Dashboard Load:
```
[AUTH] Session validated: { userId: 5, role: 'Admin', teamId: 2, hasTeam: true }
[FILTER] Role normalized: { original: 'Admin', normalized: 'admin' }
[FILTER] Team-based filter: { teamId: 2 }
```

### Master Load (Courier):
```
[AUTH] Session validated: { userId: 5, role: 'Admin', teamId: 2, hasTeam: true }
[FILTER] Role normalized: { original: 'Admin', normalized: 'admin' }
[FILTER] Team-based filter: { teamId: 2 }
```

### Add New Record:
```
[AUTH] Session validated: { userId: 5, role: 'Admin', teamId: 2, hasTeam: true }
[FILTER] Role normalized: { original: 'Admin', normalized: 'admin' }
[FILTER] Team-based filter: { teamId: 2 }
```

---

## ✅ Success Criteria

Your system is working correctly if:

1. ✅ Admin can login and see team data
2. ✅ Admin can logout and login again - data persists
3. ✅ Clerk can login and see team data
4. ✅ Clerk doesn't get "Failed to fetch data" error
5. ✅ Adding new master shows immediately
6. ✅ No `.filter is not a function` errors
7. ✅ Team isolation works (different teams see different data)
8. ✅ Console shows proper `[AUTH]` and `[FILTER]` logs
9. ✅ No 401/500 errors in Network tab
10. ✅ Page refresh doesn't lose data

---

## 🆘 If All Else Fails

1. **Check Database:**
   ```sql
   -- Verify user has TeamID
   SELECT "UserID", "Email", "RoleID", "TeamID" FROM "User" WHERE "Email" = 'your@email.com';
   
   -- Verify team exists
   SELECT * FROM "Team";
   ```

2. **Check JWT Token:**
   - Open DevTools → Application → Cookies
   - Copy `token` value
   - Go to https://jwt.io
   - Paste token
   - Verify payload has: `userId`, `role`, `teamId`

3. **Check API Directly:**
   ```bash
   # Replace YOUR_TOKEN with actual token from cookies
   curl -H "Cookie: token=YOUR_TOKEN" http://localhost:3000/api/dashboard
   ```

4. **Enable Verbose Logging:**
   The system now has comprehensive logging. Just check the console!

---

## 📞 Need Help?

If issues persist:
1. Share console logs (with `[AUTH]` and `[FILTER]` messages)
2. Share Network tab screenshot (showing API calls)
3. Share database query results (user's TeamID)
4. Share JWT token payload (from jwt.io)

This will help identify the exact issue!
