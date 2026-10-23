// ==UserScript==
// @name         Gemini MCP Overdrive - Auto Allow
// @namespace    https://github.com/gemini-chat-overdrive
// @version      1.0.0
// @description  Aprova automaticamente as confirmações de ferramentas MCP no Gemini Web (Permitir / Allow)
// @author       Gemini Chat Overdrive
// @match        https://gemini.google.com/*
// @icon         https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7fcd8cfbe.svg
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let autoAllowEnabled = true;
    const handledButtons = new WeakSet();

    const badge = document.createElement('div');
    badge.id = 'overdrive-auto-allow-badge';
    badge.title = 'Clique para pausar/ativar auto-aprovação do MCP';
    badge.style.cssText = `
        position: fixed;
        bottom: 14px;
        right: 18px;
        z-index: 999999;
        padding: 6px 14px;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: all 0.2s ease;
    `;

    function updateBadge() {
        if (autoAllowEnabled) {
            badge.style.background = '#137333';
            badge.style.color = '#ffffff';
            badge.innerHTML = '⚡ MCP Auto-Allow: <b>ATIVO</b>';
        } else {
            badge.style.background = '#d93025';
            badge.style.color = '#ffffff';
            badge.innerHTML = '⏸️ MCP Auto-Allow: <b>PAUSADO</b>';
        }
    }

    badge.addEventListener('click', () => {
        autoAllowEnabled = !autoAllowEnabled;
        updateBadge();
    });

    function mountBadge() {
        if (!document.getElementById('overdrive-auto-allow-badge')) {
            document.body.appendChild(badge);
            updateBadge();
        }
    }

    if (document.body) {
        mountBadge();
    } else {
        window.addEventListener('DOMContentLoaded', mountBadge);
    }

    function checkAndAllow() {
        if (!autoAllowEnabled) return;

        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            if (handledButtons.has(btn)) continue;

            const txt = (btn.innerText || btn.textContent || '').trim().toLowerCase();
            if (txt === 'permitir' || txt === 'allow' || txt === 'permitir sempre' || txt === 'always allow') {
                if (btn.offsetParent !== null && !btn.disabled) {
                    handledButtons.add(btn);
                    setTimeout(() => {
                        if (!btn.disabled) {
                            btn.click();
                            console.log('[Overdrive Auto-Allow] Botão de permissão aprovado automaticamente.');
                        }
                    }, 80);
                }
            }
        }
    }

    const observer = new MutationObserver(() => {
        mountBadge();
        checkAndAllow();
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    setInterval(checkAndAllow, 400);
    console.log('[Overdrive Auto-Allow] Userscript carregado.');
})();
