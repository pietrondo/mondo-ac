# Specification: WebGL Error Overlay

## Description
This specification defines the error boundary and fallback UI overlay for handling WebGL initialization failures, pointer lock errors, and uncaught runtime crashes.

## Requirements
1. **WebGL Support Verification**:
   - The application MUST check for WebGL context availability before initializing the renderer.
   - If WebGL is not available, the application MUST display a fullscreen blocking overlay and prevent game execution.
2. **Unhandled Runtime Crash Display**:
   - The application MUST listen for global runtime errors via `window.onerror` and unhandled promise rejections via `window.onunhandledrejection`.
   - On detecting a runtime crash, the system MUST halt rendering, clean up mouse lock, and display a fullscreen crash overlay.
   - The crash overlay MUST display a readable error message, error stack (if available), and a "Reload / Retry" button.
3. **Pointer Lock Warning**:
   - The application MUST listen for the `pointerlockerror` event on `document`.
   - When a pointer lock request is rejected by the browser, the application SHOULD show a non-blocking instructional message advising the user to click the canvas or interact with the page to allow mouse capture.

## Scenarios

### Scenario 1: WebGL is unsupported or disabled in the browser
* **Given** a browser environment that does not support WebGL or has WebGL disabled
* **When** the game application starts
* **Then** the application MUST NOT initialize the Three.js renderer
* **And** a blocking overlay with ID `error-overlay` MUST be appended to the DOM body, showing "WebGL not supported"

### Scenario 2: An unhandled exception occurs during gameplay
* **Given** the game has successfully loaded and is running
* **When** an unhandled synchronous or asynchronous error is thrown
* **Then** the global error listeners MUST catch the exception
* **And** a fullscreen overlay with ID `error-overlay` MUST be displayed on top of the canvas
* **And** the overlay MUST contain a reload button with ID `error-reload-btn` that reloads the page when clicked

### Scenario 3: Browser rejects pointer lock request
* **Given** the player clicks the "Start" overlay
* **When** the browser fires a `pointerlockerror` event
* **Then** the application MUST display an overlay or text warning instructing the user to click again to trigger pointer lock
