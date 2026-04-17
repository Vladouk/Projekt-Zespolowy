# 🔧 COURIER PROFILE FIX - Камоўка: "Courier profile not found"

## 📋 Problem Description
When a courier clicks on "Замовлення" (Orders), they receive an error:
- **Error**: "Nie udało się załadować zamówienia: Courier profile not found"
- **Reason**: The courier profile was not created during registration

## 🔍 Root Cause Analysis

### Issue 1: Missing Phone Field During Registration
- The registration form did NOT ask for phone number
- Backend requires `phone TEXT NOT NULL` for courier profile
- When registering as courier, the INSERT fails because `phone` is missing
- No error is thrown, but no courier profile is created

### Issue 2: Incomplete Data Insertion
**Before (BROKEN):**
```python
if role == 'courier':
    cursor.execute('''
        INSERT INTO couriers (user_id, status)
        VALUES (?, ?)
    ''', (user_id, 'offline'))
```
- Missing required `phone` field
- INSERT fails silently due to NOT NULL constraint

**After (FIXED):**
```python
if role == 'courier':
    cursor.execute('''
        INSERT INTO couriers (user_id, phone, status)
        VALUES (?, ?, ?)
    ''', (user_id, data.get('phone', ''), 'offline'))
```
- Now includes phone field
- Frontend collects phone number

---

## ✅ FIXES APPLIED

### 1. Frontend Changes (login.html)

#### Added Phone Field to Registration Form
```html
<div class="form-group" id="phoneField" style="display: none;">
    <label for="reg-phone">Numer Telefonu (dla kurierów)</label>
    <input 
        type="tel" 
        id="reg-phone" 
        placeholder="Np. +48 123 456 789"
    >
</div>
```

#### Added JavaScript to Toggle Phone Field
```javascript
function togglePhoneField() {
    const role = document.getElementById('reg-role').value;
    const phoneField = document.getElementById('phoneField');
    const phoneInput = document.getElementById('reg-phone');
    
    if (role === 'courier') {
        phoneField.style.display = 'block';
        phoneInput.required = true;
    } else {
        phoneField.style.display = 'none';
        phoneInput.required = false;
        phoneInput.value = '';
    }
}
```

#### Updated Registration Form Submission
```javascript
const phone = document.getElementById('reg-phone').value;
body: JSON.stringify({ username, email, password, role, phone })
```

### 2. Backend Changes (app.py)

#### Fixed Courier Profile Creation
```python
if role == 'courier':
    cursor.execute('''
        INSERT INTO couriers (user_id, phone, status)
        VALUES (?, ?, ?)
    ''', (user_id, data.get('phone', ''), 'offline'))
    conn.commit()
```

---

## 🚀 How to Test

### Step 1: Clean Database (Optional but Recommended)
If you had failed courier registrations before:
```bash
rm database.db
```
Or restart the backend to reinitialize.

### Step 2: Register as Courier
1. Go to login page
2. Click "Zarejestruj się" (Register)
3. Fill in:
   - Nazwa Użytkownika: `kurier_test`
   - Email: `kurier@test.com`
   - Hasło: `test123`
   - Rola: **Select "Kurier"** (now phone field appears)
   - Numer Telefonu: `+48 123 456 789` (required now)

### Step 3: Log in and View Orders
1. Log in with courier credentials
2. Click "Zamówienia" (Orders) button
3. ✅ Should now see: "Brak przypisanych zamówień" (No assigned orders)
4. ❌ Should NOT see: "Courier profile not found"

### Step 4: Test with Client Order
1. Log out, register as client
2. Create an order
3. Log back in as courier
4. Click "Dostępne Zamówienia" (Available Orders)
5. ✅ Should now see the new order

---

## 📊 Summary of Changes

| Component | File | Change | Status |
|-----------|------|--------|--------|
| Frontend Form | `login.html` | Added phone field for couriers | ✅ FIXED |
| Frontend JS | `login.html` | Added togglePhoneField() function | ✅ FIXED |
| Frontend Submit | `login.html` | Include phone in registration payload | ✅ FIXED |
| Backend Registration | `app.py` line 264 | Insert phone to couriers table | ✅ FIXED |

---

## 🔍 Verification Query

To verify courier profile exists after registration:
```sql
SELECT u.username, c.id, c.phone, c.status
FROM users u
LEFT JOIN couriers c ON u.id = c.user_id
WHERE u.role = 'courier';
```

Should show:
| username | id | phone | status |
|----------|-----|-------|--------|
| kurier_test | 2 | +48 123 456 789 | offline |

---

## ⚠️ Important Notes

1. **Database Reset**: If you had courier accounts before, delete `database.db` and restart
2. **Phone is Required**: Phone field now required for couriers during registration
3. **API Compatibility**: Backend now expects `phone` field in registration payload
4. **Future Enhancement**: Can add phone validation (regex pattern) if needed

---

## 🎯 Expected Behavior After Fix

✅ Courier registration creates a profile
✅ Courier can view "Moje Zamówienia" without errors
✅ Courier can see available orders to accept
✅ Courier phone number is stored in database
✅ Orders can be properly assigned to couriers

**Status**: 🟢 READY FOR TESTING
