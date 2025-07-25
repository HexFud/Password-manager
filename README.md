# Vault - A Modern & Secure Password Manager

Vault is a secure, self-hosted password manager built with a Python backend and a modern, revolutionary web interface. It allows you to store and manage your sensitive credentials locally, with all data encrypted on your disk.

---

## ✨ Features

-   **Secure by Design**: All passwords and sensitive data are encrypted using the `cryptography` library (AES-256 in GCM mode).
-   **Master Password**: A single master password protects your entire vault.
-   **Modern Web GUI**: An intuitive and beautiful user interface built with HTML, CSS, and vanilla JavaScript.
-   **Detailed Entries**: Store not just a password, but also a username, URL, category, and notes for each entry.
-   **Instant Search**: Quickly find the account you're looking for.
-   **Secure Password Generator**: Create strong, random passwords directly from the app.
-   **Copy to Clipboard**: Easily copy usernames and passwords with a single click.
-   **Local First**: All your data stays on your machine. Nothing is sent to the cloud.

## 🛠️ Tech Stack

-   **Backend**: Python 3, Flask
-   **Encryption**: Fernet (from the `cryptography` library)
-   **Frontend**: HTML5, CSS3, JavaScript (no frameworks)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

You need to have Python 3 and `pip` installed on your system.

-   [Python 3](https://www.python.org/downloads/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/tuo-username/vault-password-manager.git
    cd vault-password-manager
    ```

2.  **Create and activate a virtual environment (recommended):**
    -   On Windows:
        ```sh
        python -m venv venv
        .\venv\Scripts\activate
        ```
    -   On macOS/Linux:
        ```sh
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install the required dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Run the application:**
    ```sh
    python backend.py
    ```

### Usage

Once the server is running, open your web browser and navigate to:

**http://127.0.0.1:5000/**

-   **First Run**: You will be prompted to create a strong master password.
-   **Subsequent Runs**: You will need to enter your master password to unlock the vault.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
