export const STYLE = `
.netdisk-download {
  --nd-primary: #574ab8;
  --nd-bg: #fff;
  --nd-fg: #1f2328;
  --nd-muted: #6b7280;
  --nd-border: #e5e7eb;
  --nd-danger: #cc3235;
  --nd-success: #2f9e44;
  color-scheme: light dark;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.nd-button-wrap {
  position: relative;
  display: inline-block;
  margin: 0 8px;
  font-size: 14px;
}

.nd-trigger {
  border: 0;
  border-radius: 6px;
  background: var(--nd-primary);
  color: #fff;
  cursor: pointer;
  padding: 7px 14px;
  line-height: 1.2;
}

.nd-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 10000;
  display: none;
  min-width: 150px;
  margin: 0;
  padding: 4px;
  list-style: none;
  border: 1px solid var(--nd-border);
  border-radius: 8px;
  background: var(--nd-bg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.nd-button-wrap.open .nd-menu {
  display: block;
}

.nd-menu-item {
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--nd-fg);
  cursor: pointer;
  white-space: nowrap;
}

.nd-menu-item:hover {
  background: rgba(87, 74, 184, 0.1);
}

.nd-menu-sep {
  height: 1px;
  margin: 4px 2px;
  background: var(--nd-border);
}

.nd-overlay {
  position: fixed;
  inset: 0;
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
  color: var(--nd-fg);
}

.nd-modal {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: min(80vh, 720px);
  border-radius: 12px;
  background: var(--nd-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.nd-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--nd-border);
}

.nd-modal-title {
  flex: 1;
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.nd-close {
  border: 0;
  background: transparent;
  color: var(--nd-muted);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.nd-modal-body {
  flex: 1;
  padding: 8px 20px;
  overflow: auto;
}

.nd-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--nd-border);
}

.nd-item:last-child {
  border-bottom: 0;
}

.nd-name {
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-weight: 600;
  word-break: break-all;
}

.nd-size {
  flex: none;
  color: var(--nd-muted);
  font-size: 12px;
  font-weight: 400;
}

.nd-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.nd-btn {
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  background: var(--nd-bg);
  color: var(--nd-fg);
  cursor: pointer;
  padding: 6px 12px;
  font-size: 13px;
}

.nd-btn:hover {
  border-color: var(--nd-primary);
  color: var(--nd-primary);
}

.nd-btn.nd-primary {
  border-color: var(--nd-primary);
  background: var(--nd-primary);
  color: #fff;
}

.nd-btn.nd-danger {
  border-color: var(--nd-danger);
  background: var(--nd-danger);
  color: #fff;
}

.nd-btn.nd-success {
  border-color: var(--nd-success);
  background: var(--nd-success);
  color: #fff;
}

.nd-code {
  margin: 10px 0 0;
  padding: 10px;
  border-radius: 8px;
  background: #f6f8fa;
  color: #24292f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.nd-message {
  margin-top: 8px;
  color: var(--nd-danger);
  font-size: 13px;
  word-break: break-all;
}

.nd-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nd-settings {
  display: flex;
  flex-direction: column;
}

.nd-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--nd-border);
}

.nd-section:last-of-type {
  border-bottom: 0;
}

.nd-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.nd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.nd-section-head h4 {
  margin: 0;
}

.nd-rpc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nd-rpc {
  padding: 10px;
  border: 1px solid var(--nd-border);
  border-radius: 8px;
}

.nd-rpc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.nd-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.nd-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px 12px;
}

.nd-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--nd-muted);
  font-size: 12px;
}

.nd-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--nd-border);
  border-radius: 6px;
  background: var(--nd-bg);
  color: var(--nd-fg);
  font: inherit;
  font-size: 13px;
}

.nd-input:focus {
  border-color: var(--nd-primary);
  outline: 2px solid rgba(87, 74, 184, 0.35);
  outline-offset: 1px;
}

.nd-settings-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0 4px;
}

.nd-settings-error {
  flex: 1;
  color: var(--nd-danger);
  font-size: 13px;
}

.nd-loading-overlay {
  background: rgba(0, 0, 0, 0.35);
}

.nd-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 260px;
  padding: 28px;
  border-radius: 12px;
  background: var(--nd-bg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.nd-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid var(--nd-border);
  border-top-color: var(--nd-primary);
  border-radius: 50%;
  animation: nd-spin 0.8s linear infinite;
}

.nd-loading-title {
  font-size: 16px;
  font-weight: 600;
}

.nd-loading-text {
  color: var(--nd-muted);
  font-size: 13px;
  white-space: pre-wrap;
}

.nd-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100001;
  max-width: min(420px, calc(100vw - 40px));
  padding: 12px 16px;
  border-radius: 8px;
  background: #1f2328;
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.nd-toast-error {
  background: var(--nd-danger);
}

.nd-toast-success {
  background: var(--nd-success);
}

@keyframes nd-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-color-scheme: dark) {
  .netdisk-download {
    --nd-bg: #1f2328;
    --nd-fg: #e6edf3;
    --nd-muted: #9ca3af;
    --nd-border: #3d444d;
  }

  .nd-code {
    background: #161b22;
    color: #e6edf3;
  }

  .nd-menu-item:hover {
    background: rgba(87, 74, 184, 0.25);
  }
}
`
