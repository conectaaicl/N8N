(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var TENANT = script.getAttribute('data-tenant') || 'osw';
  var BASE_URL = script.src.replace('/widget.js', '');
  var STORAGE_KEY = 'omniflow_visitor_' + TENANT;
  var POLL_INTERVAL = 4000;

  // ── Visitor ID ────────────────────────────────────────────────────────────
  function getVisitorId() {
    var id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'vis_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  var visitorId = getVisitorId();
  var config = { color: '#7c3aed', greeting: '¡Hola! ¿En qué puedo ayudarte?', bot_name: 'Asistente', enabled: true };
  var lastMsgCount = 0;
  var pollTimer = null;
  var isOpen = false;

  // ── Load config ───────────────────────────────────────────────────────────
  fetch(BASE_URL + '/api/v1/webchat/config/' + TENANT)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      config = Object.assign(config, data);
      if (config.enabled) init();
    })
    .catch(function () { init(); });

  // ── Styles ────────────────────────────────────────────────────────────────
  function injectStyles() {
    var css = `
      #omniflow-widget * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      #omniflow-btn {
        position: fixed; bottom: 24px; right: 24px; z-index: 99999;
        width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s;
      }
      #omniflow-btn:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(0,0,0,0.4); }
      #omniflow-btn svg { pointer-events: none; }
      #omniflow-badge {
        position: absolute; top: -4px; right: -4px;
        background: #ef4444; color: white; border-radius: 999px;
        font-size: 10px; font-weight: bold; min-width: 18px; height: 18px;
        display: none; align-items: center; justify-content: center; padding: 0 4px;
      }
      #omniflow-panel {
        position: fixed; bottom: 92px; right: 24px; z-index: 99998;
        width: 360px; max-width: calc(100vw - 48px);
        background: #0d0d1a; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        display: none; flex-direction: column;
        transition: opacity 0.2s, transform 0.2s;
        opacity: 0; transform: translateY(12px) scale(0.97);
      }
      #omniflow-panel.open { display: flex; opacity: 1; transform: translateY(0) scale(1); }
      #omniflow-header {
        padding: 16px 20px; display: flex; align-items: center; gap: 12px;
      }
      #omniflow-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; font-weight: bold; color: white; flex-shrink: 0;
      }
      #omniflow-header-info { flex: 1; }
      #omniflow-header-name { color: white; font-weight: 600; font-size: 14px; }
      #omniflow-header-status { color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 1px; }
      #omniflow-messages {
        flex: 1; padding: 16px; overflow-y: auto;
        max-height: 320px; min-height: 180px;
        display: flex; flex-direction: column; gap: 8px;
        background: #08081266;
      }
      .omniflow-msg {
        max-width: 80%; padding: 10px 14px; border-radius: 16px;
        font-size: 13px; line-height: 1.5; word-break: break-word;
      }
      .omniflow-msg.bot { background: rgba(255,255,255,0.07); color: #e2e8f0; border-bottom-left-radius: 4px; align-self: flex-start; }
      .omniflow-msg.user { color: white; border-bottom-right-radius: 4px; align-self: flex-end; }
      #omniflow-input-area {
        padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.06);
        display: flex; gap: 8px; background: #0d0d1a;
      }
      #omniflow-input {
        flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 10px 14px; color: white; font-size: 13px; outline: none;
        transition: border-color 0.2s;
      }
      #omniflow-input:focus { border-color: rgba(255,255,255,0.2); }
      #omniflow-input::placeholder { color: rgba(255,255,255,0.25); }
      #omniflow-send {
        width: 38px; height: 38px; border-radius: 10px; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        color: white; transition: opacity 0.2s;
      }
      #omniflow-send:hover { opacity: 0.85; }
      #omniflow-footer {
        padding: 8px; text-align: center;
        font-size: 10px; color: rgba(255,255,255,0.2);
        border-top: 1px solid rgba(255,255,255,0.04);
      }
    `;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function buildWidget() {
    var color = config.color || '#7c3aed';

    var wrapper = document.createElement('div');
    wrapper.id = 'omniflow-widget';

    wrapper.innerHTML = `
      <button id="omniflow-btn" style="background:${color}" aria-label="Abrir chat">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span id="omniflow-badge"></span>
      </button>
      <div id="omniflow-panel" role="dialog" aria-label="Chat">
        <div id="omniflow-header" style="background:${color}22; border-bottom:1px solid ${color}33">
          <div id="omniflow-avatar" style="background:${color}">${(config.bot_name || 'A')[0]}</div>
          <div id="omniflow-header-info">
            <div id="omniflow-header-name">${config.bot_name || 'Asistente'}</div>
            <div id="omniflow-header-status">● En línea</div>
          </div>
        </div>
        <div id="omniflow-messages"></div>
        <div id="omniflow-input-area">
          <input id="omniflow-input" type="text" placeholder="Escribe un mensaje..." autocomplete="off" />
          <button id="omniflow-send" style="background:${color}" aria-label="Enviar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div id="omniflow-footer">Powered by OmniFlow</div>
      </div>
    `;

    document.body.appendChild(wrapper);

    // Show greeting
    appendMsg('bot', config.greeting || '¡Hola! ¿En qué puedo ayudarte?');

    // Events
    document.getElementById('omniflow-btn').addEventListener('click', togglePanel);
    document.getElementById('omniflow-send').addEventListener('click', sendMessage);
    document.getElementById('omniflow-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
  }

  function togglePanel() {
    isOpen = !isOpen;
    var panel = document.getElementById('omniflow-panel');
    if (isOpen) {
      panel.style.display = 'flex';
      setTimeout(function () { panel.classList.add('open'); }, 10);
      document.getElementById('omniflow-badge').style.display = 'none';
      document.getElementById('omniflow-input').focus();
      if (!pollTimer) startPolling();
    } else {
      panel.classList.remove('open');
      setTimeout(function () { panel.style.display = 'none'; }, 200);
    }
  }

  function appendMsg(type, text) {
    var messages = document.getElementById('omniflow-messages');
    if (!messages) return;
    var div = document.createElement('div');
    div.className = 'omniflow-msg ' + type;
    div.textContent = text;
    var color = config.color || '#7c3aed';
    if (type === 'user') div.style.background = color;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    var input = document.getElementById('omniflow-input');
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    appendMsg('user', text);

    fetch(BASE_URL + '/api/v1/webchat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_subdomain: TENANT,
        visitor_id: visitorId,
        visitor_name: 'Visitante Web',
        message: text,
      }),
    }).catch(function (e) { console.error('[OmniFlow widget]', e); });
  }

  function startPolling() {
    pollTimer = setInterval(function () {
      fetch(BASE_URL + '/api/v1/webchat/messages/' + visitorId + '?tenant_subdomain=' + TENANT)
        .then(function (r) { return r.json(); })
        .then(function (msgs) {
          if (!Array.isArray(msgs)) return;
          var agentMsgs = msgs.filter(function (m) {
            return m.sender_type === 'human' || m.sender_type === 'bot';
          });
          if (agentMsgs.length > lastMsgCount) {
            var newMsgs = agentMsgs.slice(lastMsgCount);
            newMsgs.forEach(function (m) { appendMsg('bot', m.content); });
            lastMsgCount = agentMsgs.length;
            if (!isOpen) {
              var badge = document.getElementById('omniflow-badge');
              badge.textContent = newMsgs.length;
              badge.style.display = 'flex';
            }
          }
        })
        .catch(function () {});
    }, POLL_INTERVAL);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {});
  }
})();
