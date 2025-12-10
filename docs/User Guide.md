
# Aero ERP - Documentation & Installation Guide

## 1. Introduction
Thank you for purchasing **Aero**. This application is a modular ERP system built on **Laravel 11**, **React**, and **Inertia.js**. It is designed to be installed easily on standard shared hosting (cPanel) without needing complex command-line tools.

## 2. Server Requirements
Before installing, please ensure your server meets these requirements. Most standard cPanel hosts support this out of the box.

* **PHP Version:** 8.2 or higher
* **Database:** MySQL 5.7+ or MariaDB 10.3+
* **Required PHP Extensions:**
    * `BCMath`, `Ctype`, `Fileinfo`, `JSON`, `Mbstring`, `OpenSSL`, `PDO`, `Tokenizer`, `XML`, `Zip`
* **Permissions:** Writing access to the root folder (for module uploads).

> **Note:** SSH (Terminal) access is **NOT** required. Composer and Node.js are **NOT** required on your server.

---

## 3. Installation Guide (First Time)
*Use this guide if you have purchased the **Aero HRM** (Full Application).*

### Step 1: Upload Files
1.  Log in to your hosting Control Panel (e.g., cPanel, DirectAdmin).
2.  Go to **File Manager**.
3.  Upload the `Aero_HRM_Installer_v1.0.zip` file to your domain's root folder (usually `public_html`).
4.  Right-click and **Extract** the ZIP file.

### Step 2: Set Permissions
Ensure the following folders are **writable** (Permission 775 or 777):
* `/storage` (and all subfolders)
* `/bootstrap/cache`
* `/modules` (Critical for installing add-ons later)

### Step 3: Create Database
1.  Go to **MySQL Databases** in your control panel.
2.  Create a new database (e.g., `aero_db`).
3.  Create a new user and password.
4.  Add the user to the database with **All Privileges**.

### Step 4: Run the Web Installer
1.  Open your browser and visit your website (e.g., `https://your-domain.com`).
2.  You will be redirected to the **Aero Installer**.
3.  Follow the on-screen wizard:
    * **Check Requirements:** Ensure all lights are green.
    * **Database:** Enter the database details you created in Step 3.
    * **Admin Account:** Create your primary administrator login.
4.  Click **Install**. The system will configure itself automatically.

---

## 4. Installing Add-on Modules (e.g., CRM)
*Use this guide if you have purchased an add-on like **Aero CRM** to expand your existing system.*

> **⚠️ Important:** Do not upload the add-on ZIP via cPanel/FTP. Use the built-in Module Manager.

1.  **Download:** Download the `Aero_CRM_Module.zip` from CodeCanyon.
2.  **Login:** Log in to your Aero Admin Panel.
3.  **Navigate:** Go to **Settings > Modules**.
4.  **Upload:** Click the **"Upload Module"** button.
5.  **Select:** Choose the ZIP file you downloaded.
6.  **Install:** Click **Install Now**.
    * The system will automatically extract the module.
    * It will register the new menu items.
    * It will run any necessary database updates.
7.  **Refresh:** Refresh your browser. You should now see the **CRM** tab in your sidebar.

---

## 5. Troubleshooting & FAQ

### Issue: "White Screen" or "500 Error" after installation
* **Fix:** Check your `/storage/logs/laravel.log` file.
* **Common Cause:** Incorrect file permissions. Ensure `storage` and `bootstrap/cache` are writable.

### Issue: "Module Upload Failed"
* **Fix:** Ensure your PHP configuration allows file uploads larger than 2MB (`upload_max_filesize`).
* **Fix:** Ensure the `/modules` directory exists and is writable.

### Issue: "404 Not Found" for Module Assets (CSS/JS)
* **Explanation:** Aero uses a "Symlink" to serve module assets.
* **Fix:** If your host disables symlinks, you may see broken styles.
    1.  Go to `https://your-domain.com/admin/system/fix-links` (or the specific button in Settings).
    2.  This will attempt to repair the link between `public/modules` and `modules/`.

### Issue: "Missing Dependency" Error
* **Message:** *"This module requires Aero Core v1.2.0"*
* **Fix:** You are trying to install a new module on an old version of Aero. Please go to CodeCanyon, download the latest **Aero HRM** update, and update your core files first.

---

## 6. Developer Notes (Advanced)
*If you are a developer customizing Aero:*

* **Architecture:** Aero uses a modular architecture. Core files are located in `/modules/aero-core`.
* **Customization:** Do not edit files inside `/modules/aero-core` directly, as they will be overwritten during updates.
* **Frontend:** The frontend is built with React and Inertia.js. Modules use Pre-compiled Library Mode assets injected at runtime. You cannot recompile the main bundle without the source code.

---

### Need Support?
If you encounter any issues not covered here, please open a support ticket via our CodeCanyon profile. Please include:
1.  Your Purchase Code.
2.  A screenshot of the error.
3.  Your `laravel.log` file content.