use tauri::Manager;
use std::sync::Mutex;
use std::collections::HashMap;

pub struct HotkeyManager {
    registered_hotkeys: Mutex<HashMap<String, String>>,
}

impl HotkeyManager {
    pub fn new() -> Self {
        HotkeyManager {
            registered_hotkeys: Mutex::new(HashMap::new()),
        }
    }

    /// Register a new hotkey dynamically
    pub fn register_hotkey(
        &self,
        app_handle: &tauri::AppHandle,
        hotkey_id: &str,
        hotkey_str: &str,
    ) -> Result<(), String> {
        // First, unregister the old hotkey if it exists
        if let Ok(mut hotkeys) = self.registered_hotkeys.lock() {
            if let Some(old_hotkey) = hotkeys.get(hotkey_id) {
                // Unregister the old hotkey
                if let Err(e) = app_handle.global_shortcut_manager().unregister(old_hotkey) {
                    eprintln!("[Hotkey Manager] Failed to unregister old hotkey: {}", e);
                }
            }
        }

        // Register the new hotkey
        match app_handle.global_shortcut_manager().register(hotkey_str, move || {
            // This closure will be called when the hotkey is pressed
            println!("[Hotkey Manager] Hotkey pressed: {}", hotkey_str);
        }) {
            Ok(_) => {
                if let Ok(mut hotkeys) = self.registered_hotkeys.lock() {
                    hotkeys.insert(hotkey_id.to_string(), hotkey_str.to_string());
                }
                Ok(())
            }
            Err(e) => Err(format!("Failed to register hotkey: {}", e)),
        }
    }

    /// Unregister a hotkey
    pub fn unregister_hotkey(
        &self,
        app_handle: &tauri::AppHandle,
        hotkey_id: &str,
    ) -> Result<(), String> {
        if let Ok(mut hotkeys) = self.registered_hotkeys.lock() {
            if let Some(hotkey_str) = hotkeys.remove(hotkey_id) {
                match app_handle.global_shortcut_manager().unregister(&hotkey_str) {
                    Ok(_) => Ok(()),
                    Err(e) => Err(format!("Failed to unregister hotkey: {}", e)),
                }
            } else {
                Err(format!("Hotkey '{}' not found", hotkey_id))
            }
        } else {
            Err("Failed to lock hotkey registry".to_string())
        }
    }

    /// Get all registered hotkeys
    pub fn get_registered_hotkeys(&self) -> Result<HashMap<String, String>, String> {
        self.registered_hotkeys
            .lock()
            .map(|hotkeys| hotkeys.clone())
            .map_err(|e| format!("Failed to lock hotkey registry: {}", e))
    }

    /// Check if a hotkey is already registered
    pub fn is_hotkey_registered(&self, hotkey_str: &str) -> Result<bool, String> {
        if let Ok(hotkeys) = self.registered_hotkeys.lock() {
            Ok(hotkeys.values().any(|h| h == hotkey_str))
        } else {
            Err("Failed to lock hotkey registry".to_string())
        }
    }
}
