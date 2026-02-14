#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{GlobalShortcutManager, Manager, SystemTray, SystemTrayMenu, SystemTrayMenuItem, SystemTrayEvent, CustomMenuItem, Window};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn register_hotkey(app_handle: tauri::AppHandle, hotkey: &str) -> Result<(), String> {
    // First unregister any existing hotkey to avoid conflicts
    let _ = app_handle.global_shortcut().unregister(hotkey);
    
    let app_handle_clone = app_handle.clone();
    
    app_handle
        .global_shortcut()
        .on_shortcut(hotkey, move |_| {
            if let Some(window) = app_handle_clone.get_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                // Emit event to frontend
                let _ = window.emit("hotkey:activated", ());
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn unregister_hotkey(app_handle: tauri::AppHandle, hotkey: &str) -> Result<(), String> {
    app_handle
        .global_shortcut()
        .unregister(hotkey)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_hotkey(app_handle: tauri::AppHandle, old_hotkey: &str, new_hotkey: &str) -> Result<(), String> {
    // Unregister old hotkey
    let _ = app_handle.global_shortcut().unregister(old_hotkey);
    
    // Register new hotkey
    register_hotkey(app_handle, new_hotkey)
}

#[tauri::command]
fn toggle_window(window: Window) -> Result<(), String> {
    if window.is_visible().unwrap_or(false) {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

fn create_system_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let record = CustomMenuItem::new("record".to_string(), "Start Recording");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(record)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

fn handle_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => {
            match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                "record" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        // Emit event to frontend to start recording
                        let _ = window.emit("tray:start-recording", ());
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            }
        }
        SystemTrayEvent::LeftClick { .. } => {
            if let Some(window) = app.get_window("main") {
                let is_visible = window.is_visible().unwrap_or(false);
                if is_visible {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
        _ => {}
    }
}

fn main() {
    let system_tray = create_system_tray();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::init())
        .plugin(tauri_plugin_shell::init())
        .system_tray(system_tray)
        .on_system_tray_event(handle_tray_event)
        .invoke_handler(tauri::generate_handler![
            greet,
            register_hotkey,
            unregister_hotkey,
            update_hotkey,
            toggle_window,
            minimize_window,
            show_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
