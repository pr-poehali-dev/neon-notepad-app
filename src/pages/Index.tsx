import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  color: "cyan" | "magenta" | "green";
}

const COLORS = {
  cyan: {
    border: "border-cyan-400",
    shadow: "shadow-[0_0_12px_rgba(0,255,255,0.5)]",
    text: "text-cyan-400",
    glow: "rgba(0,255,255,0.8)",
    dot: "bg-cyan-400",
  },
  magenta: {
    border: "border-fuchsia-500",
    shadow: "shadow-[0_0_12px_rgba(255,0,255,0.5)]",
    text: "text-fuchsia-400",
    glow: "rgba(255,0,255,0.8)",
    dot: "bg-fuchsia-400",
  },
  green: {
    border: "border-emerald-400",
    shadow: "shadow-[0_0_12px_rgba(0,255,136,0.5)]",
    text: "text-emerald-400",
    glow: "rgba(0,255,136,0.8)",
    dot: "bg-emerald-400",
  },
};

const STORAGE_KEY = "neon-notes-v1";

function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const Index = () => {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editColor, setEditColor] = useState<Note["color"]>("cyan");
  const [saved, setSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notes.find((n) => n.id === activeId) ?? null;

  function openNote(note: Note) {
    setActiveId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color);
    setSaved(false);
  }

  function newNote() {
    const note: Note = {
      id: Date.now().toString(),
      title: "",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      color: "cyan",
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setActiveId(note.id);
    setEditTitle("");
    setEditContent("");
    setEditColor("cyan");
    setSaved(false);
    setTimeout(() => titleRef.current?.focus(), 50);
  }

  function saveNote() {
    if (!activeId) return;
    const updated = notes.map((n) =>
      n.id === activeId
        ? {
            ...n,
            title: editTitle || "Без названия",
            content: editContent,
            color: editColor,
            updatedAt: Date.now(),
          }
        : n
    );
    setNotes(updated);
    saveNotes(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function deleteNote(id: string) {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (activeId === id) setActiveId(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeId) saveNote();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, editTitle, editContent, editColor, notes]);

  const col = activeId ? COLORS[editColor] : COLORS["cyan"];

  return (
    <div
      className="scanlines flex flex-col h-screen w-screen overflow-hidden cyber-grid"
      style={{ background: "var(--dark-bg)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-0 w-72 h-72 rounded-full opacity-[0.07] blur-3xl" style={{ background: "var(--neon-cyan)" }} />
      <div className="pointer-events-none fixed bottom-0 right-0 w-72 h-72 rounded-full opacity-[0.07] blur-3xl" style={{ background: "var(--neon-magenta)" }} />

      {/* ── TOP NAV ── */}
      <header className="shrink-0 border-b border-cyan-900/60 bg-black/50 backdrop-blur-sm z-10">
        {/* Brand + controls row */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-cyan-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse-slow" style={{ boxShadow: "0 0 8px #00ffff" }} />
            <span className="font-orbitron text-xs tracking-[0.3em] text-cyan-400 animate-flicker" style={{ textShadow: "0 0 10px #00ffff" }}>
              NEON NOTES
            </span>
            <span className="font-mono-tech text-xs text-cyan-900 ml-1">v1.0</span>
          </div>

          <div className="h-4 w-px bg-cyan-900/60 mx-1" />

          {/* Search */}
          <div className="relative group flex-1 max-w-xs">
            <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-700 group-focus-within:text-cyan-400 transition-colors z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ПОИСК..."
              className="w-full bg-black/40 border border-cyan-900/50 focus:border-cyan-400 rounded pl-8 pr-3 py-1.5 text-xs font-mono-tech text-cyan-300 placeholder-cyan-900 outline-none transition-all duration-200 focus:shadow-[0_0_8px_rgba(0,255,255,0.3)]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="font-mono-tech text-xs text-cyan-900">
              {notes.length} ЗАПИСЕЙ
            </span>
            <button
              onClick={newNote}
              className="flex items-center gap-1.5 py-1.5 px-4 rounded border border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 active:scale-95 transition-all duration-150 group"
              style={{ boxShadow: "0 0 10px rgba(0,255,255,0.15)" }}
            >
              <Icon name="Plus" size={13} className="text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
              <span className="font-orbitron text-xs tracking-widest text-cyan-400">НОВАЯ</span>
            </button>
          </div>
        </div>

        {/* Notes tabs row */}
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-none">
          {filtered.length === 0 && (
            <span className="font-mono-tech text-xs text-cyan-900 px-2">
              {search ? "[ НЕТ СОВПАДЕНИЙ ]" : "[ НЕТ ЗАМЕТОК — СОЗДАЙ ПЕРВУЮ ]"}
            </span>
          )}
          {filtered.map((note) => {
            const c = COLORS[note.color];
            const isActive = note.id === activeId;
            return (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer border transition-all duration-200 shrink-0 animate-fade-in ${
                  isActive
                    ? `${c.border} bg-black/70 ${c.shadow}`
                    : "border-cyan-900/30 hover:border-cyan-700/60 bg-black/20 hover:bg-black/40"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`}
                  style={{ boxShadow: isActive ? `0 0 5px ${c.glow}` : "none" }}
                />
                <span className={`font-rajdhani font-semibold text-sm whitespace-nowrap max-w-[120px] truncate ${isActive ? c.text : "text-slate-400"}`}>
                  {note.title || "Без названия"}
                </span>
                <span className="font-mono-tech text-xs text-cyan-900 hidden group-hover:inline shrink-0">
                  {formatDate(note.updatedAt)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="shrink-0 p-0.5 text-red-800 hover:text-red-400 transition-all ml-1"
                >
                  <Icon name="X" size={11} />
                </button>
              </div>
            );
          })}
        </div>
      </header>

      {/* ── EDITOR ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 select-none">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border border-cyan-900/40 flex items-center justify-center" style={{ boxShadow: "0 0 30px rgba(0,255,255,0.04)" }}>
                <Icon name="FileText" size={36} className="text-cyan-900" />
              </div>
              <div className="absolute -inset-4 rounded-full border border-cyan-900/15 animate-pulse-slow" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-orbitron text-sm tracking-widest text-cyan-800">ВЫБЕРИ ЗАМЕТКУ</p>
              <p className="font-mono-tech text-xs text-cyan-900">или создай новую</p>
            </div>
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="px-6 py-3 border-b border-cyan-900/40 bg-black/30 backdrop-blur-sm flex items-center gap-4">
              {/* Color picker */}
              <div className="flex items-center gap-2">
                {(["cyan", "magenta", "green"] as Note["color"][]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={`w-3 h-3 rounded-full transition-all duration-150 ${COLORS[c].dot} ${
                      editColor === c ? "scale-125 ring-1 ring-white/30" : "opacity-30 hover:opacity-60"
                    }`}
                    style={{ boxShadow: editColor === c ? `0 0 8px ${COLORS[c].glow}` : "none" }}
                  />
                ))}
              </div>

              <div className={`h-4 w-px opacity-30 ${col.border}`} />

              {/* Title input */}
              <input
                ref={titleRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="НАЗВАНИЕ ЗАМЕТКИ..."
                className={`flex-1 bg-transparent outline-none font-orbitron text-sm tracking-wider placeholder-slate-800 ${col.text}`}
                style={{ textShadow: `0 0 8px ${col.glow}` }}
              />

              {/* Actions */}
              <div className="flex items-center gap-3 ml-auto shrink-0">
                {saved && (
                  <span className="font-mono-tech text-xs text-emerald-400 animate-fade-in flex items-center gap-1">
                    <Icon name="Check" size={11} />
                    СОХРАНЕНО
                  </span>
                )}
                <span className="font-mono-tech text-xs text-cyan-900 hidden md:inline">CTRL+S</span>
                <button
                  onClick={saveNote}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded border ${col.border} ${col.text} bg-transparent hover:bg-white/5 active:scale-95 transition-all duration-150 text-xs font-orbitron tracking-widest`}
                  style={{ boxShadow: `0 0 8px ${col.glow}40` }}
                >
                  <Icon name="Save" size={12} />
                  СОХРАНИТЬ
                </button>
                <button
                  onClick={() => activeId && deleteNote(activeId)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded border border-red-800 text-red-700 bg-transparent hover:bg-red-900/20 hover:border-red-500 hover:text-red-400 active:scale-95 transition-all duration-150 text-xs font-orbitron tracking-widest"
                  style={{ boxShadow: "0 0 8px rgba(255,0,0,0.15)" }}
                >
                  <Icon name="Trash2" size={12} />
                  УДАЛИТЬ
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute top-5 left-6 pointer-events-none">
                <div className={`absolute top-0 left-0 w-5 h-px ${col.dot}`} style={{ boxShadow: `0 0 4px ${col.glow}` }} />
                <div className={`absolute top-0 left-0 w-px h-5 ${col.dot}`} style={{ boxShadow: `0 0 4px ${col.glow}` }} />
              </div>
              <div className="absolute bottom-8 right-6 pointer-events-none">
                <div className={`absolute bottom-0 right-0 w-5 h-px ${col.dot}`} style={{ boxShadow: `0 0 4px ${col.glow}` }} />
                <div className={`absolute bottom-0 right-0 w-px h-5 ${col.dot}`} style={{ boxShadow: `0 0 4px ${col.glow}` }} />
              </div>

              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="> ВВЕДИ ТЕКСТ ЗАМЕТКИ..."
                className="w-full h-full resize-none bg-transparent outline-none font-mono-tech text-sm leading-relaxed text-slate-300 placeholder-slate-800 px-10 py-8"
                style={{ caretColor: col.glow }}
              />

              <div className="absolute bottom-3 right-10 font-mono-tech text-xs text-cyan-900 pointer-events-none">
                {editContent.length} СИМ
              </div>
            </div>

            {/* Status bar */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-800/30 to-transparent" />
            <div className="px-6 py-1.5 flex items-center gap-4 bg-black/20">
              <span className={`font-mono-tech text-xs ${col.text} animate-pulse-slow`} style={{ textShadow: `0 0 6px ${col.glow}` }}>
                ● ACTIVE
              </span>
              <span className="font-mono-tech text-xs text-cyan-900">
                {activeNote ? formatDate(activeNote.updatedAt) : "NEW"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-cyan-900" />
                <div className="w-1 h-1 rounded-full bg-cyan-800 animate-pulse-slow" />
                <div className="w-1 h-1 rounded-full bg-cyan-700" />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;