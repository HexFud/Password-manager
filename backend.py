import os
import json
import secrets
import string
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from cryptography.fernet import Fernet
from waitress import serve  # Importa il server di produzione

# --- App Setup ---
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

# --- Constants ---
KEY_FILE = "key.key"
DATA_FILE = "passwords.json"
MASTER_PASS_FILE = "master.dat"


# --- Cryptography Key Management ---
def generate_key():
    """Generates a new encryption key and saves it to a file."""
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(key)


def load_key():
    """Loads the encryption key from the file, generating it if it doesn't exist."""
    if not os.path.exists(KEY_FILE):
        generate_key()
    with open(KEY_FILE, "rb") as key_file:
        return key_file.read()


# Initialize Fernet suite immediately
try:
    key = load_key()
    fernet = Fernet(key)
except Exception as e:
    print(f"CRITICAL ERROR: Could not load or initialize the encryption key. Error: {e}")
    # In a real app, you might exit or handle this more gracefully.
    exit()


# --- Helper function for password generation ---
def generate_secure_password(length=16):
    """Generates a cryptographically secure password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Ensure the alphabet contains a variety of characters
    if not (any(c.islower() for c in alphabet) and
            any(c.isupper() for c in alphabet) and
            any(c.isdigit() for c in alphabet) and
            any(c in string.punctuation for c in alphabet)):
        # Fallback in case of a strange alphabet definition
        alphabet = string.ascii_letters + string.digits + string.punctuation

    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password


# --- Password Data Management ---
def load_passwords_data():
    """Loads the password JSON file or initializes an empty dictionary."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                content = f.read()
                if not content:
                    return {}
                return json.loads(content)
        except json.JSONDecodeError:
            print(f"Warning: The data file '{DATA_FILE}' is corrupted or empty. A new one will be used.")
            return {}
    return {}


def save_passwords_data(passwords):
    """Saves the password dictionary to the JSON file."""
    with open(DATA_FILE, "w") as f:
        json.dump(passwords, f, indent=4)


# --- API Endpoints ---

@app.route('/')
def index():
    """Serves the main HTML file."""
    return send_from_directory('static', 'index.html')


@app.route('/api/generate-password', methods=['GET'])
def get_generated_password():
    """Generates and returns a secure password."""
    return jsonify({"password": generate_secure_password()})


@app.route('/api/status', methods=['GET'])
def get_status():
    """Checks if the master password has been set up."""
    is_setup = os.path.exists(MASTER_PASS_FILE)
    return jsonify({"is_setup": is_setup})


@app.route('/api/setup', methods=['POST'])
def setup_master_password():
    """Sets up the master password for the first time."""
    data = request.get_json()
    master_pwd = data.get('password')
    if not master_pwd:
        return jsonify({"error": "Password cannot be empty"}), 400
    encrypted_master_pwd = fernet.encrypt(master_pwd.encode())
    with open(MASTER_PASS_FILE, "wb") as f:
        f.write(encrypted_master_pwd)
    return jsonify({"message": "Master password created successfully"}), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates using the master password."""
    data = request.get_json()
    master_pwd_attempt = data.get('password')
    if not os.path.exists(MASTER_PASS_FILE):
        return jsonify({"error": "System not set up"}), 400
    with open(MASTER_PASS_FILE, "rb") as f:
        encrypted_master_pwd = f.read()
    try:
        decrypted_master_pwd = fernet.decrypt(encrypted_master_pwd).decode()
        if master_pwd_attempt == decrypted_master_pwd:
            return jsonify({"message": "Authentication successful"})
        else:
            return jsonify({"error": "Invalid master password"}), 401
    except Exception:
        return jsonify({"error": "Authentication failed. The key may have changed or the data is corrupt."}), 500


@app.route('/api/passwords', methods=['GET'])
def get_passwords():
    """Gets a list of all accounts with their categories for the sidebar."""
    passwords = load_passwords_data()
    account_list = [{"account": name, "category": data.get("category", "General")} for name, data in passwords.items()]
    return jsonify(account_list)


@app.route('/api/passwords', methods=['POST'])
def add_password():
    """Adds a new, detailed password entry."""
    data = request.get_json()
    account = data.get('account')

    if not account:
        return jsonify({"error": "Account name is required"}), 400

    passwords = load_passwords_data()
    if account in passwords:
        return jsonify({"error": "An entry for this account already exists"}), 409

    encrypted_data = {
        "username": fernet.encrypt(data.get('username', '').encode()).decode(),
        "password": fernet.encrypt(data.get('password', '').encode()).decode(),
        "url": data.get('url', ''),
        "notes": fernet.encrypt(data.get('notes', '').encode()).decode(),
        "category": data.get('category', 'General')
    }

    passwords[account] = encrypted_data
    save_passwords_data(passwords)
    return jsonify({"message": f"Password for '{account}' saved successfully"}), 201


@app.route('/api/passwords/<account_name>', methods=['GET'])
def get_password_details(account_name):
    """Retrieves and decrypts full details for a specific account."""
    passwords = load_passwords_data()
    if account_name in passwords:
        try:
            encrypted_data = passwords[account_name]
            decrypted_data = {
                "account": account_name,
                "username": fernet.decrypt(encrypted_data['username'].encode()).decode(),
                "password": fernet.decrypt(encrypted_data['password'].encode()).decode(),
                "url": encrypted_data.get('url', ''),
                "notes": fernet.decrypt(encrypted_data['notes'].encode()).decode(),
                "category": encrypted_data.get('category', 'General')
            }
            return jsonify(decrypted_data)
        except Exception as e:
            return jsonify({"error": f"Failed to decrypt password: {e}"}), 500
    else:
        return jsonify({"error": "Account not found"}), 404


@app.route('/api/passwords/<account_name>', methods=['PUT'])
def update_password(account_name):
    """Updates an existing password entry."""
    data = request.get_json()
    passwords = load_passwords_data()
    if account_name not in passwords:
        return jsonify({"error": "Account not found"}), 404

    updated_data = {
        "username": fernet.encrypt(data.get('username', '').encode()).decode(),
        "password": fernet.encrypt(data.get('password', '').encode()).decode(),
        "url": data.get('url', ''),
        "notes": fernet.encrypt(data.get('notes', '').encode()).decode(),
        "category": data.get('category', 'General')
    }

    passwords[account_name] = updated_data
    save_passwords_data(passwords)
    return jsonify({"message": f"Details for '{account_name}' updated successfully"})


@app.route('/api/passwords/<account_name>', methods=['DELETE'])
def delete_password(account_name):
    """Deletes a saved password."""
    passwords = load_passwords_data()
    if account_name in passwords:
        del passwords[account_name]
        save_passwords_data(passwords)
        return jsonify({"message": f"Password for '{account_name}' deleted"})
    else:
        return jsonify({"error": "Account not found"}), 404


# --- Main entry point ---
if __name__ == '__main__':
    # When developing, you can uncomment the app.run() line and
    # comment out the waitress.serve() line to enable debug mode and auto-reloading.
    # This provides detailed error messages directly in the browser.
    # app.run(debug=True, host='127.0.0.1', port=5000)

    # For the final version, a production-ready WSGI server like Waitress is used.
    # It's more stable, secure, and efficient than Flask's built-in development server.
    print("Starting production server...")
    print("Access the application at: http://127.0.0.1:5000")
    serve(app, host='127.0.0.1', port=5000)