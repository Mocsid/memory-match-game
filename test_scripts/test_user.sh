#!/bin/bash

# --- Configuration ---
BACKEND_URL="http://localhost:3001/api/auth"
USERNAME="testuser_$(date +%s)"  # Unique username
DEVICE_ID="device_$(date +%s)"
IP_ADDRESS="192.168.1.100"

# --- Helper Functions ---

# Function to extract a JSON value from curl output.
# Now takes the JSON string as the second argument.
extract_json_value() {
  local path="$1"
  local json_string="$2"
  echo "$json_string" | jq -r "$path"
}

# --- Tests ---

echo "--- 1. Signup ---"
signup_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"deviceId\": \"$DEVICE_ID\",
    \"ipAddress\": \"$IP_ADDRESS\"
  }" \
  "$BACKEND_URL/signup")

# Check for signup success
if [ "$(extract_json_value '.success' "$signup_response")" != "true" ]; then
  echo "Signup failed:"
  echo "$signup_response"
  exit 1
fi

USER_ID=$(extract_json_value '.userId' "$signup_response")
SESSION_TOKEN=$(extract_json_value '.sessionToken' "$signup_response")

echo "   - User ID: $USER_ID"
echo "   - Session Token: $SESSION_TOKEN"

echo "--- 2. Get User Profile ---"
profile_response=$(curl -s -X GET \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$BACKEND_URL/profile/$USER_ID")

# Check for profile success
if [ "$(extract_json_value '.success' "$profile_response")" != "true" ]; then
  echo "Get Profile failed:"
  echo "$profile_response"
  exit 1
fi

echo "   - Profile retrieved successfully."
echo "$profile_response" | jq .

echo "--- 3. Login (same user) ---"
login_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"deviceId\": \"$DEVICE_ID\",
    \"ipAddress\": \"$IP_ADDRESS\"
  }" \
  "$BACKEND_URL/login")


if [ "$(extract_json_value '.success' "$login_response")" != "true" ]; then
    echo "Login Failed:"
    echo "$login_response"
    exit 1
fi

NEW_SESSION_TOKEN=$(extract_json_value '.sessionToken' "$login_response")
echo "   - New Session Token from Login: $NEW_SESSION_TOKEN"

# Demonstrate that the old token is no longer valid.
echo "--- 4.  Attempt to use old session token (should fail) ---"
old_token_response=$(curl -s -X GET \
    -H "Authorization: Bearer $SESSION_TOKEN" \
    "$BACKEND_URL/profile/$USER_ID")

if [ "$(extract_json_value '.error' "$old_token_response")" = "Invalid session token" ];
then
    echo "   - Old token correctly rejected."
else
    echo "   - ERROR: Old token was unexpectedly accepted!"
    echo "$old_token_response"
    exit 1
fi

echo "--- 5. Get User Profile (New Token) ---"

profile_response_new=$(curl -s -X GET \
  -H "Authorization: Bearer $NEW_SESSION_TOKEN" \
  "$BACKEND_URL/profile/$USER_ID")

# Check for profile success
if [ "$(extract_json_value '.success' "$profile_response_new")" != "true" ]; then
  echo "Get Profile failed:"
  echo "$profile_response_new"
  exit 1
fi

echo "   - Profile retrieved successfully."
echo "$profile_response_new" | jq . # Pretty-print the JSON response


echo "--- 6. Logout ---"
logout_response=$(curl -s -X POST \
  -H "Authorization: Bearer $NEW_SESSION_TOKEN" \
    -H "Content-Type: application/json" \
  "$BACKEND_URL/logout/$USER_ID")

if [ "$(extract_json_value '.success' "$logout_response")" != "true" ]; then
  echo "Logout failed:"
  echo "$logout_response"
  exit 1
fi

echo "   - Logged out successfully."

echo "--- 7.  Attempt to use logged-out session token (should fail) ---"
logged_out_token_response=$(curl -s -X GET \
 -H "Authorization: Bearer $NEW_SESSION_TOKEN" \
 "$BACKEND_URL/profile/$USER_ID")

if [ "$(extract_json_value '.error' "$logged_out_token_response")" = "Invalid session token" ]; then
    echo "   - Logged-out token correctly rejected."
else
    echo "   - ERROR: Logged-out token was unexpectedly accepted!"
     echo "$logged_out_token_response"
    exit 1
fi

echo "--- All tests passed! ---"

exit 0