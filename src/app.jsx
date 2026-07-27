import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

import Header from './components/Header.jsx';
import Log from './components/Log.jsx';
import StatusLine from './components/StatusLine.jsx';
import Palette from './components/Palette.jsx';
import AuthPanel from './components/AuthPanel.jsx';
import Prompt from './components/Prompt.jsx';
import Banner from './components/Banner.jsx';
import SlashHints from './components/SlashHints.jsx';
import Sidebar from './components/Sidebar.jsx';
import { buildTree } from './tree.js';
import { theme, providerColor } from './theme.js';
import { allModels, providerOf, streamChat } from './providers.js';
import { getKey, setKey, deleteKey, authStatus } from './auth.js';
import { loadConfig, saveConfig } from './config.js';

const COMMANDS = [
  { id: 'model', label: '/model', tag: 'switch model' },
  { id: 'auth', label: '/auth', tag: 'add or remove api keys' },
  { id: 'new', label: '/new', tag: 'clear this session' },
  { id: 'cost', label: '/cost', tag: 'token usage so far' },
  { id: 'help', label: '/help', tag: 'keybinds and commands' },
  { id: 'quit', label: '/quit', tag: 'exit pixelcli' },
];

const shortCwd = () => {
  const cwd = process.cwd();
  const home = os.homedir();
  return cwd.startsWith(home) ? `~${cwd.slice(home.length)}` : cwd;
};

const gitBranch = () => {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
};

let nextId = 0;
const uid = () => `t${nextId++}`;
const estimate = (s) => Math.ceil((s || '').length / 4);

export default function App() {
  const { exit } = useApp();
  const [config, setConfig] = useState(() => loadConfig());
  const [turns, setTurns] = useState([]);
  const [draft, setDraft] = useState('');
  const [cursor, setCursor] = useState(0);
  const [view, setView] = useState('chat');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState({ sent: 0, received: 0 });
  const [authRows, setAuthRows] = useState(() => authStatus());
  const [entering, setEntering] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const abortRef = useRef(null);

  const cwd = useMemo(shortCwd, []);
  const branch = useMemo(gitBranch, []);
  const tree = useMemo(() => buildTree(process.cwd()), []);
  const model = config.model;
  const provider = providerOf(model);
  // shells out to the macOS Keychain, so never call this on every render
  const keyState = useMemo(() => getKey(provider), [provider, authRows]);

  const push = useCallback((turn) => {
    setTurns((prev) => [...prev, { id: uid(), ...turn }]);
  }, []);

  const say = useCallback((content, tone) => push({ role: 'system', content, tone }), [push]);

  const modelItems = useMemo(() => {
    const q = query.toLowerCase();
    return allModels()
      .filter((m) => m.id.toLowerCase().includes(q) || m.provider.includes(q))
      .map((m) => ({
        id: m.id,
        label: m.id,
        group: m.provider,
        color: providerColor[m.provider],
        tag: m.id === model ? `current · ${m.context}` : m.context,
      }));
  }, [query, model]);

  const commandItems = useMemo(() => {
    const q = query.toLowerCase();
    return COMMANDS.filter((c) => c.label.includes(q));
  }, [query]);

  // Live suggestions while typing a `/command` at the chat prompt. Only while
  // still typing the command name (no space yet).
  const slashItems = useMemo(() => {
    if (!draft.startsWith('/') || draft.includes(' ')) return [];
    const q = draft.slice(1).toLowerCase();
    return COMMANDS.filter((c) => c.id.startsWith(q));
  }, [draft]);

  const resetPalette = () => {
    setQuery('');
    setIndex(0);
  };

  async function send(text) {
    const { key } = getKey(provider);
    if (!key) {
      say(`no api key for ${provider}. run /auth to add one.`, 'error');
      return;
    }

    const history = [
      ...turns.filter((t) => t.role === 'user' || t.role === 'assistant'),
      { role: 'user', content: text },
    ].map((t) => ({ role: t.role, content: t.content }));

    const replyId = uid();
    setTurns((prev) => [
      ...prev,
      { id: uid(), role: 'user', content: text },
      { id: replyId, role: 'assistant', content: '', model, provider },
    ]);
    setUsage((u) => ({ ...u, sent: u.sent + estimate(text) }));
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      for await (const chunk of streamChat({
        provider,
        model,
        apiKey: key,
        messages: history,
        signal: controller.signal,
      })) {
        setTurns((prev) =>
          prev.map((t) => (t.id === replyId ? { ...t, content: t.content + chunk } : t)),
        );
        setUsage((u) => ({ ...u, received: u.received + estimate(chunk) }));
      }
    } catch (err) {
      if (err.name !== 'AbortError') say(`${provider}: ${err.message}`, 'error');
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function runCommand(id) {
    resetPalette();
    if (id === 'model') {
      setView('models');
      return;
    }
    if (id === 'auth') {
      setAuthRows(authStatus());
      setView('auth');
      return;
    }
    setView('chat');
    if (id === 'new') {
      setTurns([]);
      setUsage({ sent: 0, received: 0 });
    } else if (id === 'cost') {
      say(`this session: ⇡${usage.sent} ⇣${usage.received} tokens (estimated)`);
    } else if (id === 'help') {
      say(
        'commands  ' +
          COMMANDS.map((c) => c.label).join('  ') +
          '\nkeys      ^p commands · ^o model · ^b sidebar · ^r stop · ^c quit',
      );
    } else if (id === 'quit') {
      exit();
    }
  }

  function submitDraft() {
    const text = draft.trim();
    setDraft('');
    setCursor(0);
    if (!text) return;
    if (text.startsWith('/')) {
      const name = text.slice(1).split(' ')[0].toLowerCase();
      // exact id first, otherwise resolve an unambiguous prefix (e.g. /mo -> /model)
      let cmd = COMMANDS.find((c) => c.id === name);
      if (!cmd) {
        const matches = COMMANDS.filter((c) => c.id.startsWith(name));
        if (matches.length === 1) cmd = matches[0];
      }
      if (cmd) runCommand(cmd.id);
      else say(`unknown command: ${text}`, 'error');
      return;
    }
    send(text);
  }

  function editLine(input, key, value, pos, setValue, setPos) {
    if (key.leftArrow) return setPos(Math.max(0, pos - 1));
    if (key.rightArrow) return setPos(Math.min(value.length, pos + 1));
    if (key.backspace || key.delete) {
      if (pos === 0) return undefined;
      setValue(value.slice(0, pos - 1) + value.slice(pos));
      return setPos(pos - 1);
    }
    // a multi-byte chunk is a paste; strip the control bytes it carries
    const text = input?.replace(/[\u0000-\u001f\u007f]/g, "") ?? "";
    if (text && !key.ctrl && !key.meta && !key.escape) {
      setValue(value.slice(0, pos) + text + value.slice(pos));
      return setPos(pos + text.length);
    }
    return undefined;
  }

  useInput((input, key) => {
    if (key.ctrl && input === 'c') return exit();
    if (key.ctrl && input === 'r') {
      abortRef.current?.abort();
      return;
    }
    if (key.ctrl && input === 'b') {
      setShowSidebar((s) => !s);
      return;
    }

    if (view === 'chat') {
      if (key.ctrl && input === 'p') {
        resetPalette();
        setView('commands');
        return;
      }
      if (key.ctrl && input === 'o') {
        resetPalette();
        setView('models');
        return;
      }
      if (key.tab) {
        // autocomplete the top slash suggestion
        const top = slashItems[0];
        if (top) {
          const completed = `${top.label} `;
          setDraft(completed);
          setCursor(completed.length);
        }
        return;
      }
      if (key.return) return submitDraft();
      editLine(input, key, draft, cursor, setDraft, setCursor);
      return;
    }

    if (view === 'auth') {
      if (entering) {
        if (key.escape) {
          setEntering(false);
          setKeyDraft('');
          return;
        }
        if (key.return) {
          const v = keyDraft.trim();
          if (v) {
            const where = setKey(authRows[index].provider, v);
            say(`saved ${authRows[index].provider} key to ${where}`);
            setAuthRows(authStatus());
          }
          setKeyDraft('');
          setEntering(false);
          return;
        }
        editLine(input, key, keyDraft, keyDraft.length, setKeyDraft, () => {});
        return;
      }
      if (key.escape) return setView('chat');
      if (key.upArrow) return setIndex((i) => Math.max(0, i - 1));
      if (key.downArrow) return setIndex((i) => Math.min(authRows.length - 1, i + 1));
      if (key.return) return setEntering(true);
      if (input === 'd') {
        deleteKey(authRows[index].provider);
        setAuthRows(authStatus());
      }
      return;
    }

    const items = view === 'models' ? modelItems : commandItems;
    if (key.escape) {
      setView('chat');
      resetPalette();
      return;
    }
    if (key.upArrow) return setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) return setIndex((i) => Math.min(items.length - 1, i + 1));
    if (key.return) {
      const chosen = items[index];
      if (!chosen) return;
      if (view === 'models') {
        setConfig(saveConfig({ model: chosen.id }));
        setView('chat');
        resetPalette();
        say(`switched to ${chosen.id}`);
      } else {
        runCommand(chosen.id);
      }
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setIndex(0);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setIndex(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Header
        cwd={cwd}
        branch={branch}
        model={model}
        provider={provider}
        ready={Boolean(keyState.key)}
      />

      <Box flexDirection="row">
        {showSidebar ? <Sidebar cwd={cwd} tree={tree} width="20%" /> : null}

        <Box flexDirection="column" flexGrow={1} width={showSidebar ? '80%' : '100%'}>
          {view === 'auth' ? (
            <AuthPanel rows={authRows} index={index} entering={entering} draft={keyDraft} />
          ) : turns.length === 0 ? (
            <Banner />
          ) : (
            <Log turns={turns} />
          )}

          {view === 'models' || view === 'commands' ? (
            <Palette
              prompt={view === 'models' ? '› switch model' : '› /'}
              query={query}
              items={view === 'models' ? modelItems : commandItems}
              index={index}
              footer={
                view === 'models' ? '↑↓ move · ⏎ select · esc cancel' : '↑↓ move · ⏎ run · esc cancel'
              }
            />
          ) : view === 'chat' ? (
            <Box flexDirection="column">
              <Box borderStyle="round" borderColor={theme.line} paddingX={1} marginX={1}>
                <Text color={providerColor[provider] ?? theme.faint}>› </Text>
                <Prompt
                  value={draft}
                  cursor={cursor}
                  placeholder=" ask anything, or / for commands"
                />
              </Box>
              {slashItems.length > 0 ? <SlashHints items={slashItems} /> : null}
            </Box>
          ) : null}
        </Box>
      </Box>

      <StatusLine
        mode={view === 'chat' ? 'CHAT' : view.toUpperCase()}
        sent={usage.sent}
        received={usage.received}
        busy={busy}
      />
    </Box>
  );
}
