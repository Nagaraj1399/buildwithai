import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Send, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Tag, 
  BookOpen, 
  MessageSquare, 
  Copy, 
  Check, 
  Smile, 
  Filter, 
  Layers 
} from 'lucide-react';
import Markdown from 'react-markdown';
import { JournalEntry, ChatTurn, ReflectionMode } from '../types';
import { 
  saveJournalEntry, 
  getUserJournalEntries, 
  deleteJournalEntry 
} from '../lib/firebase';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Active editor / conversation state
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');
  const [followUpText, setFollowUpText] = useState('');
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['reflection']);
  const [mode, setMode] = useState<ReflectionMode>('reflect');

  // AI Generation & Persistence State
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chat scroll ref
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Load entries on mount and user change
  useEffect(() => {
    loadUserEntries();
  }, [user.uid]);

  const loadUserEntries = async () => {
    setLoadingEntries(true);
    try {
      const userEntries = await getUserJournalEntries(user.uid);
      setEntries(userEntries);
      if (userEntries.length > 0 && !activeEntry) {
        selectEntry(userEntries[0]);
      } else if (userEntries.length === 0) {
        startNewEntry();
      }
    } catch (err: any) {
      console.error('Failed to load entries from Firestore:', err);
      setErrorMessage(`Failed to load history: ${err?.message || 'Database error'}`);
    } finally {
      setLoadingEntries(false);
    }
  };

  const startNewEntry = () => {
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      userEmail: user.email || undefined,
      title: 'New Reflection',
      initialContent: '',
      turns: [],
      tags: ['reflection'],
      mood: 'reflective',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setActiveEntry(newEntry);
    setEntryTitle(newEntry.title);
    setEntryContent('');
    setFollowUpText('');
    setTags(newEntry.tags);
    setSelectedMood('reflective');
    setSaveStatus('idle');
    setErrorMessage(null);
  };

  const selectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setEntryTitle(entry.title || 'Untitled Reflection');
    setEntryContent(entry.initialContent || '');
    setFollowUpText('');
    setTags(entry.tags || []);
    setSelectedMood(entry.mood || 'reflective');
    setSaveStatus('idle');
    setErrorMessage(null);
  };

  // Scroll chat bottom smoothly when turns change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeEntry?.turns, generating]);

  // Handle adding a tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Copy text helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete an entry
  const handleDeleteEntry = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteJournalEntry(user.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);
      if (activeEntry?.id === entryId) {
        if (remaining.length > 0) {
          selectEntry(remaining[0]);
        } else {
          startNewEntry();
        }
      }
    } catch (err: any) {
      console.error('Failed to delete entry:', err);
      setErrorMessage(`Delete failed: ${err?.message || 'Permission denied'}`);
    }
  };

  // Submit initial reflection or conversation turn
  const handleSubmitPrompt = async (isFollowUp: boolean = false) => {
    const textToSend = isFollowUp ? followUpText.trim() : entryContent.trim();
    if (!textToSend || generating) return;

    if (!activeEntry) return;

    setGenerating(true);
    setErrorMessage(null);
    setSaveStatus('saving');

    const newUserTurn: ChatTurn = {
      id: 'turn_user_' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
      mode,
    };

    // Prepare updated turns list
    const currentTurns = activeEntry.turns || [];
    const updatedTurnsWithUser = [...currentTurns, newUserTurn];

    // Format conversation messages for API
    const apiMessages = updatedTurnsWithUser.map((t) => ({
      role: t.role,
      content: t.text,
    }));

    try {
      // 1. Call resilient backend API proxy
      const res = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode,
          context: {
            title: entryTitle,
            initialContent: entryContent,
            tags,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();

      // 2. Create AI Turn with model info
      const newModelTurn: ChatTurn = {
        id: 'turn_model_' + Date.now(),
        role: 'model',
        text: data.reply,
        timestamp: Date.now(),
        mode: data.mode,
        modelUsed: data.modelUsed,
      };

      const finalTurns = [...updatedTurnsWithUser, newModelTurn];

      // Auto-extract title if it's the first turn and title is default
      let effectiveTitle = entryTitle;
      if (entryTitle === 'New Reflection' || entryTitle.trim() === '') {
        effectiveTitle = textToSend.slice(0, 45).trim() + (textToSend.length > 45 ? '...' : '');
        setEntryTitle(effectiveTitle);
      }

      const updatedEntry: JournalEntry = {
        ...activeEntry,
        title: effectiveTitle,
        initialContent: isFollowUp ? activeEntry.initialContent : textToSend,
        turns: finalTurns,
        tags,
        mood: selectedMood,
        summary: mode === 'summarize' ? data.reply : activeEntry.summary,
        updatedAt: Date.now(),
      };

      // 3. Guaranteed Transaction Verification & Persistence to Firestore
      await saveJournalEntry(updatedEntry);

      // 4. Update UI State ONLY after successful confirmed write
      setActiveEntry(updatedEntry);
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === updatedEntry.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEntry;
          return next;
        }
        return [updatedEntry, ...prev];
      });

      if (isFollowUp) {
        setFollowUpText('');
      }

      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Reflection interaction failed:', err);
      setSaveStatus('error');
      setErrorMessage(
        err?.message || 'Failed to process reflection and save to Firestore. Your input has been preserved.'
      );
      // Notice: Input buffer (entryContent or followUpText) is intentionally NOT cleared per directive!
    } finally {
      setGenerating(false);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    const matchesSearch =
      searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.initialContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.turns && e.turns.some((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesTag = !selectedTag || (e.tags && e.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  // All unique tags across entries
  const allUniqueTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  );

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col md:flex-row overflow-hidden bg-stone-100">
      {/* ========================================================================= */}
      {/* Sidebar: Entry History & Search                                           */}
      {/* ========================================================================= */}
      <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r border-stone-200 bg-white shrink-0">
        {/* Top Actions */}
        <div className="p-4 border-b border-stone-200">
          <button
            id="new-entry-btn"
            onClick={startNewEntry}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-98 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Plus className="h-4 w-4" />
            <span>New Journal Reflection</span>
          </button>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              id="search-entries-input"
              type="text"
              placeholder="Search past reflections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Tags filter chip row */}
          {allUniqueTags.length > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <button
                onClick={() => setSelectedTag(null)}
                className={`rounded-full px-2.5 py-0.5 whitespace-nowrap transition ${
                  selectedTag === null
                    ? 'bg-stone-900 text-white font-medium'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                All
              </button>
              {allUniqueTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`rounded-full px-2 py-0.5 whitespace-nowrap transition ${
                    selectedTag === t
                      ? 'bg-amber-700 text-white font-medium'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-2">
          {loadingEntries ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <RefreshCw className="h-5 w-5 animate-spin mb-2" />
              <p className="text-xs">Loading isolated entries...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-stone-400">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-medium text-stone-600">No reflections found</p>
              <p className="text-[11px] mt-1 text-stone-400">
                {searchQuery || selectedTag ? 'Try clearing your filters' : 'Start your first journal entry!'}
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isActive = activeEntry?.id === entry.id;
              const dateStr = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={entry.id}
                  onClick={() => selectEntry(entry)}
                  className={`group relative flex flex-col gap-1 rounded-xl p-3 text-left transition cursor-pointer mb-1 ${
                    isActive
                      ? 'bg-amber-50/80 border border-amber-200/80 shadow-xs'
                      : 'hover:bg-stone-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xs font-semibold text-stone-900 line-clamp-1">
                      {entry.title || 'Untitled Reflection'}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 hover:bg-stone-100 rounded transition"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {entry.initialContent || (entry.turns && entry.turns[0]?.text) || 'Empty reflection'}
                  </p>

                  <div className="mt-1 flex items-center justify-between text-[10px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {dateStr}
                    </span>
                    {entry.turns && entry.turns.length > 0 && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-amber-700 font-medium">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {entry.turns.length} turns
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div className="border-t border-stone-200 p-3 bg-stone-50 text-[11px] text-stone-500 flex items-center justify-between">
          <span>{entries.length} Isolated {entries.length === 1 ? 'Entry' : 'Entries'}</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium font-mono text-[10px]">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Firestore Sync
          </span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* Main Workspace: Editor, Reflection Modes & Multi-Turn Thread             */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {activeEntry ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Entry Workspace Header */}
            <div className="border-b border-stone-200 px-6 py-3.5 bg-stone-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={entryTitle}
                  onChange={(e) => setEntryTitle(e.target.value)}
                  placeholder="Reflection Title..."
                  className="w-full bg-transparent font-serif text-base font-semibold text-stone-900 focus:outline-none focus:ring-0 placeholder-stone-400"
                />
                <div className="flex items-center gap-2 mt-1">
                  {/* Mood Selector */}
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value as any)}
                    className="rounded border border-stone-200 bg-white px-2 py-0.5 text-[11px] text-stone-600 focus:outline-none focus:border-amber-500"
                  >
                    <option value="reflective">Reflective</option>
                    <option value="grateful">Grateful</option>
                    <option value="curious">Curious</option>
                    <option value="challenged">Challenged</option>
                    <option value="energized">Energized</option>
                    <option value="neutral">Neutral</option>
                  </select>

                  {/* Tags */}
                  <div className="flex items-center gap-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded bg-stone-200/80 px-1.5 py-0.5 text-[10px] text-stone-700"
                      >
                        #{t}
                        <button
                          onClick={() => handleRemoveTag(t)}
                          className="text-stone-400 hover:text-stone-700 ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+ tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="w-14 rounded border border-dashed border-stone-300 bg-transparent px-1.5 py-0.5 text-[10px] text-stone-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Transaction & Persistence Status Indicator */}
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-700 animate-pulse font-mono">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Syncing Firestore...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Saved to Firestore
                  </span>
                )}
                {saveStatus === 'error' && (
                  <button
                    onClick={() => handleSubmitPrompt(false)}
                    className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded hover:bg-red-100 transition"
                  >
                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                    <span>Save Failed - Retry</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Banner if any */}
            {errorMessage && (
              <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 text-xs text-red-700 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-500 hover:text-red-800 font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Conversation / Journal Flow Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Initial Journal Reflection Prompt Box (if no turns yet or viewing initial text) */}
              {(!activeEntry.turns || activeEntry.turns.length === 0) && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-amber-600" />
                      Write Your Journal Reflection
                    </label>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {entryContent.length} / 10,000 chars
                    </span>
                  </div>

                  <textarea
                    id="journal-input-textarea"
                    rows={6}
                    value={entryContent}
                    onChange={(e) => setEntryContent(e.target.value)}
                    placeholder="Pour out your thoughts, questions, dilemmas, or accomplishments today... (e.g. 'I’m feeling torn between two major career pathways and struggling to focus...')"
                    className="w-full resize-none rounded-xl border border-stone-200 p-3.5 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                  />

                  {/* Mode Selector & Action Buttons */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-stone-500 mr-1">Gemini Mode:</span>
                      {(['reflect', 'summarize', 'brainstorm', 'reframe'] as ReflectionMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                            mode === m
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-transparent'
                          }`}
                        >
                          {m === 'reflect' && 'Reflect & Inquire'}
                          {m === 'summarize' && 'Summarize'}
                          {m === 'brainstorm' && 'Brainstorm Ideas'}
                          {m === 'reframe' && 'Cognitive Reframe'}
                        </button>
                      ))}
                    </div>

                    <button
                      id="submit-reflection-btn"
                      onClick={() => handleSubmitPrompt(false)}
                      disabled={generating || !entryContent.trim()}
                      className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-900"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Gemini Reflecting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                          <span>Converse with Gemini</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Turn Thread */}
              {activeEntry.turns && activeEntry.turns.length > 0 && (
                <div className="space-y-4">
                  {activeEntry.turns.map((turn, index) => {
                    const isUser = turn.role === 'user';
                    return (
                      <div
                        key={turn.id || index}
                        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs mt-1">
                            <Sparkles className="h-4 w-4" />
                          </div>
                        )}

                        <div
                          className={`relative max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? 'bg-stone-900 text-white rounded-br-xs'
                              : 'bg-stone-50 border border-stone-200 text-stone-800 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {/* Top Meta info */}
                          <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-stone-200/40 text-[10px]">
                            <span className={isUser ? 'text-stone-300 font-medium' : 'text-stone-500 font-medium'}>
                              {isUser ? 'Your Journal Reflection' : 'Gemini Companion'}
                            </span>
                            <div className="flex items-center gap-2">
                              {!isUser && turn.modelUsed && (
                                <span className="rounded bg-amber-100/80 px-1.5 py-0.5 font-mono text-[10px] text-amber-800">
                                  {turn.modelUsed}
                                </span>
                              )}
                              <button
                                onClick={() => handleCopy(turn.text, turn.id)}
                                className="opacity-70 hover:opacity-100 transition"
                                title="Copy content"
                              >
                                {copiedId === turn.id ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Content */}
                          {isUser ? (
                            <p className="whitespace-pre-wrap font-sans text-stone-100">{turn.text}</p>
                          ) : (
                            <div className="markdown-body prose prose-stone prose-xs max-w-none prose-headings:font-serif prose-headings:text-stone-900 prose-p:text-stone-800 prose-li:text-stone-800">
                              <Markdown>{turn.text}</Markdown>
                            </div>
                          )}
                        </div>

                        {isUser && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-white shadow-xs mt-1 text-xs font-semibold">
                            {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Generating Placeholder */}
                  {generating && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs mt-1 animate-pulse">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="max-w-md rounded-2xl rounded-bl-xs border border-stone-200 bg-stone-50 p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
                          <span>Consulting Gemini 3.6 Flash Fallback Ladder...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>
              )}
            </div>

            {/* Bottom Multi-Turn Follow-Up Input Bar */}
            {activeEntry.turns && activeEntry.turns.length > 0 && (
              <div className="border-t border-stone-200 bg-stone-50 p-4 shrink-0">
                <div className="mx-auto max-w-3xl flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <div className="flex items-center gap-2">
                      <span>Continue conversation mode:</span>
                      {(['reflect', 'summarize', 'brainstorm', 'reframe'] as ReflectionMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`rounded px-2 py-0.5 text-[10px] capitalize transition ${
                            mode === m
                              ? 'bg-amber-600 text-white font-medium'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <span className="font-mono text-[10px]">Cmd/Ctrl + Enter to send</span>
                  </div>

                  <div className="flex items-end gap-2">
                    <textarea
                      id="followup-textarea"
                      rows={2}
                      value={followUpText}
                      onChange={(e) => setFollowUpText(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          handleSubmitPrompt(true);
                        }
                      }}
                      placeholder="Ask a follow-up, explore a blind spot, or deepen this reflection..."
                      className="flex-1 resize-none rounded-xl border border-stone-200 bg-white p-3 text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed font-sans"
                    />

                    <button
                      id="send-followup-btn"
                      onClick={() => handleSubmitPrompt(true)}
                      disabled={generating || !followUpText.trim()}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white shadow transition hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-stone-900"
                      title="Send response"
                    >
                      {generating ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
            <BookOpen className="h-12 w-12 text-stone-300 mb-3" />
            <h3 className="font-serif text-base font-semibold text-stone-700">No Reflection Selected</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Select a reflection from the history sidebar on the left or create a new entry to get started.
            </p>
            <button
              onClick={startNewEntry}
              className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition"
            >
              Start New Reflection
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
