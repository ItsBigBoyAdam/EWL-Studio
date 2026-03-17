import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code2, 
  Eye, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Settings,
  Info,
  ChevronRight,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  FileJson,
  FileText,
  X,
  Layout,
  HelpCircle,
  Zap,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Files,
  ArrowRightLeft
} from 'lucide-react';
import { compileEWL, generateFullHtml, generateFullPhp } from './compiler/ewl-compiler';
import { compileEML } from './compiler/eml-compiler';

const EML_SAMPLE = `<eml>
  <meta>
    <title>EvoTeam Sample Page</title>
  </meta>

  <content>
    <title1>Welcome to EvoTeam</title1>
    <text>Hello, **World**! This is a simple EML page.</text>

    <title2>About Us</title2>
    <text>*EvoTeam* is a community for coding and web projects.</text>

    <link url="https://evoteam.kesug.com">Visit EvoTeam</link>

    <image src="https://picsum.photos/seed/evoteam/300/300" width="150"/>

    <button>Join Us</button>

    <title3>Our Skills</title3>
    <text>Here’s what we focus on:</text>
    <list>
      <item>HTML</item>
      <item>CSS</item>
      <item>JavaScript</item>
    </list>
  </content>
</eml>`;

const MASTER_TEMPLATE = `<EWL 1.0>
 <start>
tab "EWL Master Showcase"
theme dark
bg_color "#0a0a0a"

<p1> "Evo Web Language Master"
navbar_h {
  link_title "Home" -> "#"
  link_title "Features" -> "#"
  link_title "Pricing" -> "#"
  link_title "Contact" -> "#"
}
text "This template showcases **every single command** available in EWL 1.0."

row {
  card {
    <p2> "Layout & Text"
    text "You can use *italics* and **bold** text easily."
    <p3> "Lists"
    list {
      Item 1
      Item 2
      Item 3
    }
  }
  card {
    <p2> "Interactive"
    button "Standard Button"
    button_link "Link Button" -> "https://google.com"
    link "https://example.com"
  }
}

<p2> "Media & Embeds"
row {
  image "https://picsum.photos/seed/ewl/400/300" width 300
  iframe "https://wikipedia.org" width: 400
}

<p2> "Forms"
form {
  input "Full Name"
  checkbox "Accept Terms"
  button "Submit Form"
}

<p2> "PHP & Database"
link_php "config.php"
text "The following block is a PHP database loop (visible in PHP export):"
php_loop "users" {
  card {
    <p3> "User: {{row['name']}}"
    text "Email: {{row['email']}}"
  }
}

<p2> "Advanced"
link_css "custom.css"
link_js "custom.js"
video "https://www.w3schools.com/html/mov_bbb.mp4"
audio {
  "https://www.w3schools.com/html/horse.mp3"
}
<end>`;

const COMMANDS = [
  { cmd: 'tab "Title"', desc: 'Sets the browser tab title' },
  { cmd: 'theme light | dark', desc: 'Sets the page theme' },
  { cmd: 'bg_color "#hex"', desc: 'Sets custom background color' },
  { cmd: '<p1> "Text"', desc: 'Main Heading (H1)' },
  { cmd: '<p2> "Text"', desc: 'Subheading (H2)' },
  { cmd: '<p3> "Text"', desc: 'Small Heading (H3)' },
  { cmd: 'text "Content"', desc: 'Paragraph (supports **bold** and *italic*)' },
  { cmd: 'link "URL"', desc: 'Clickable link' },
  { cmd: 'image "URL"', desc: 'Displays an image' },
  { cmd: 'image "URL" width 200', desc: 'Image with specific width' },
  { cmd: 'button "Text"', desc: 'Standard button' },
  { cmd: 'button_link "Text" -> "URL"', desc: 'Button that links to a URL' },
  { cmd: 'card { ... }', desc: 'Container for grouping content' },
  { cmd: 'row { ... }', desc: 'Side-by-side layout' },
  { cmd: 'list { ... }', desc: 'Unordered list' },
  { cmd: 'form { ... }', desc: 'Form container' },
  { cmd: 'input "Placeholder"', desc: 'Text input field' },
  { cmd: 'checkbox "Label"', desc: 'Checkbox field' },
  { cmd: 'video "URL"', desc: 'Video player' },
  { cmd: 'audio { "URL" }', desc: 'Audio player' },
  { cmd: 'iframe "URL" width: 150', desc: 'Embed external page' },
  { cmd: 'link_css "URL"', desc: 'Link external CSS file' },
  { cmd: 'link_js "URL"', desc: 'Link external JS file' },
  { cmd: 'link_php "file.php"', desc: 'Link PHP backend script' },
  { cmd: 'php_loop "table" { ... }', desc: 'PHP database loop (use {{row["col"]}} for variables)' },
  { cmd: 'navbar_h { ... }', desc: 'Horizontal navigation bar' },
  { cmd: 'navbar_v { ... }', desc: 'Vertical navigation bar' },
  { cmd: 'link_title "Text" -> "URL"', desc: 'Navigation link (used inside navbars)' }
];

interface Tab {
  id: string;
  name: string;
  content: string;
  mode: 'ewl' | 'eml';
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>(() => {
    const saved = localStorage.getItem('ewl_tabs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tabs", e);
      }
    }
    return [{ id: '1', name: 'Main Project', content: MASTER_TEMPLATE, mode: 'ewl' }];
  });
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || '1');
  const [view, setView] = useState<'playground' | 'converter'>('playground');
  const [mode, setMode] = useState<'ewl' | 'eml'>(() => tabs.find(t => t.id === activeTabId)?.mode || 'ewl');
  const [converterInput, setConverterInput] = useState('');
  
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);

  const [history, setHistory] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    tabs.forEach(t => initial[t.id] = [t.content]);
    return initial;
  });
  const [historyIndex, setHistoryIndex] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    tabs.forEach(t => initial[t.id] = 0);
    return initial;
  });

  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('ewl_theme') as 'light' | 'dark') || 'light');
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emlView, setEmlView] = useState<'html' | 'xml'>('html');

  useEffect(() => {
    localStorage.setItem('ewl_tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('ewl_theme', appTheme);
  }, [appTheme]);

  const compiled = useMemo(() => {
    if (activeTab.mode === 'ewl') {
      return compileEWL(activeTab.content);
    } else {
      const compiledEml = compileEML(activeTab.content);
      return {
        ...compiledEml,
        theme: 'light' as const,
        bgColor: '#ffffff',
        cssLinks: [],
        jsLinks: [],
        phpLinks: []
      };
    }
  }, [activeTab]);

  const converterCompiled = useMemo(() => compileEWL(converterInput), [converterInput]);

  useEffect(() => {
    document.title = compiled.title;
  }, [compiled.title]);

  const updateInput = (newVal: string) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newVal } : t));
    
    setHistory(prev => {
      const currentHistory = prev[activeTabId] || [];
      const currentIndex = historyIndex[activeTabId] || 0;
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(newVal);
      if (newHistory.length > 50) newHistory.shift();
      return { ...prev, [activeTabId]: newHistory };
    });

    setHistoryIndex(prev => ({
      ...prev,
      [activeTabId]: Math.min((prev[activeTabId] || 0) + 1, 49)
    }));
  };

  const undo = () => {
    const currentHistory = history[activeTabId] || [];
    const currentIndex = historyIndex[activeTabId] || 0;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setHistoryIndex(prev => ({ ...prev, [activeTabId]: prevIndex }));
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: currentHistory[prevIndex] } : t));
    }
  };

  const redo = () => {
    const currentHistory = history[activeTabId] || [];
    const currentIndex = historyIndex[activeTabId] || 0;
    if (currentIndex < currentHistory.length - 1) {
      const nextIndex = currentIndex + 1;
      setHistoryIndex(prev => ({ ...prev, [activeTabId]: nextIndex }));
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: currentHistory[nextIndex] } : t));
    }
  };

  const addTab = () => {
    const newId = Date.now().toString();
    const newTab: Tab = { id: newId, name: `New Tab ${tabs.length + 1}`, content: MASTER_TEMPLATE, mode: 'ewl' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setMode('ewl');
    setHistory(prev => ({ ...prev, [newId]: [MASTER_TEMPLATE] }));
    setHistoryIndex(prev => ({ ...prev, [newId]: 0 }));
  };

  const removeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id);
      setMode(newTabs[0].mode);
    }
  };

  const renameTab = (id: string) => {
    const name = prompt("Enter new tab name:", tabs.find(t => t.id === id)?.name);
    if (name) {
      setTabs(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullHtml(compiled));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    downloadFile(generateFullHtml(compiled), 'index.html', 'text/html');
  };

  const handleDownloadEwl = () => {
    downloadFile(activeTab.content, 'project.ewl', 'text/plain');
  };

  const saveConverterToTab = () => {
    if (!converterInput.trim()) return;
    const newId = Date.now().toString();
    const newTab: Tab = { 
      id: newId, 
      name: `Imported ${tabs.length + 1}`, 
      content: converterInput, 
      mode: 'ewl' 
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    setMode('ewl');
    setHistory(prev => ({ ...prev, [newId]: [converterInput] }));
    setHistoryIndex(prev => ({ ...prev, [newId]: 0 }));
    setView('playground');
    setConverterInput('');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${appTheme === 'dark' ? 'bg-[#0F0F0F] text-white' : 'bg-[#F5F5F4] text-[#1A1A1A]'} font-sans selection:bg-emerald-100 selection:text-emerald-900`}>
      {/* Header */}
      <header className={`h-16 border-b ${appTheme === 'dark' ? 'border-white/5 bg-black/80' : 'border-black/5 bg-white/80'} backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
              <FileCode size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Evo Web Compiler</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Version 1.2 Pro</p>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl max-w-[400px] overflow-x-auto custom-scrollbar no-scrollbar">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setMode(tab.mode);
                }}
                onDoubleClick={() => renameTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all whitespace-nowrap ${activeTabId === tab.id ? 'bg-white dark:bg-white/20 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
              >
                <Files size={12} />
                <span>{tab.name}</span>
                {tabs.length > 1 && (
                  <X 
                    size={12} 
                    className="hover:text-red-500 transition-colors" 
                    onClick={(e) => removeTab(tab.id, e)}
                  />
                )}
              </div>
            ))}
            <button 
              onClick={addTab}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => {
                setMode('ewl');
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode: 'ewl' } : t));
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab.mode === 'ewl' ? 'bg-white dark:bg-white/20 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
            >
              EWL
            </button>
            <button
              onClick={() => {
                setMode('eml');
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode: 'eml' } : t));
              }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab.mode === 'eml' ? 'bg-white dark:bg-white/20 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
            >
              EML
            </button>
          </div>
          <button 
            onClick={() => setView(view === 'playground' ? 'converter' : 'playground')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'converter' ? 'bg-emerald-600 text-white' : (appTheme === 'dark' ? 'bg-white/5 text-emerald-400 hover:bg-white/10' : 'bg-black/5 text-gray-600 hover:bg-black/10')}`}
          >
            <ArrowRightLeft size={14} />
            <span>{view === 'converter' ? 'Back to Editor' : 'Converter'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Editor Controls */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={undo}
              disabled={(historyIndex[activeTabId] || 0) === 0}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all disabled:opacity-30"
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={(historyIndex[activeTabId] || 0) === (history[activeTabId]?.length || 1) - 1}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all disabled:opacity-30"
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeTab.content);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all"
              title="Copy Code"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
            <button
              onClick={() => updateInput(activeTab.mode === 'ewl' ? '<EWL 1.0>\n <start>\n\n<end>' : '<eml>\n  <content>\n\n  </content>\n</eml>')}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-white dark:hover:bg-white/10 transition-all"
              title="Clear Editor"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => updateInput(activeTab.mode === 'ewl' ? MASTER_TEMPLATE : EML_SAMPLE)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all"
            >
              {activeTab.mode === 'ewl' ? 'Master Template' : 'EML Sample'}
            </button>
          </div>

          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

          <button 
            onClick={() => setAppTheme(appTheme === 'light' ? 'dark' : 'light')}
            className={`p-2.5 rounded-xl transition-all ${appTheme === 'dark' ? 'bg-white/5 text-amber-400 hover:bg-white/10' : 'bg-black/5 text-gray-600 hover:bg-black/10'}`}
          >
            {appTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => setShowHelp(true)}
            className={`p-2.5 rounded-xl transition-all ${appTheme === 'dark' ? 'bg-white/5 text-emerald-400 hover:bg-white/10' : 'bg-black/5 text-gray-600 hover:bg-black/10'}`}
          >
            <HelpCircle size={20} />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

          <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button onClick={handleDownloadHtml} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all">
              <Download size={14} /><span>HTML</span>
            </button>
            <button onClick={handleDownloadEwl} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-blue-600 hover:bg-white dark:hover:bg-white/10 transition-all">
              <FileText size={14} /><span>EWL</span>
            </button>
            <button 
              onClick={() => {
                const blob = new Blob([generateFullPhp(compiled)], { type: 'application/x-httpd-php' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'index.php';
                a.click();
                URL.revokeObjectURL(url);
              }} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-purple-600 hover:bg-white dark:hover:bg-white/10 transition-all"
            >
              <FileCode size={14} /><span>PHP</span>
            </button>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-64px)] flex overflow-hidden">
        {view === 'playground' ? (
          <>
            {/* Editor Section */}
            <div className={`w-1/2 border-r ${appTheme === 'dark' ? 'border-white/5 bg-[#141414]' : 'border-black/5 bg-white'} flex flex-col`}>
              <div className={`h-10 px-4 border-b ${appTheme === 'dark' ? 'border-white/5 bg-black/20' : 'border-black/5 bg-gray-50/50'} flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <Code2 size={14} />
                  <span>{activeTab.mode.toUpperCase()} Editor</span>
                </div>
                <div className="flex items-center gap-4">
                  {activeTab.mode === 'eml' && (
                    <div className="flex items-center gap-1 bg-black/10 dark:bg-white/10 p-1 rounded-lg">
                      <button 
                        onClick={() => setEmlView('html')}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${emlView === 'html' ? 'bg-white dark:bg-white/20 shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        HTML
                      </button>
                      <button 
                        onClick={() => setEmlView('xml')}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${emlView === 'xml' ? 'bg-white dark:bg-white/20 shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        XML
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-gray-400">
                    {activeTab.content.length} characters
                  </div>
                </div>
              </div>
              <textarea
                value={activeTab.content}
                onChange={(e) => updateInput(e.target.value)}
                className={`flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-transparent ${appTheme === 'dark' ? 'text-emerald-50/90' : 'text-gray-800'}`}
                spellCheck={false}
                placeholder={`Write your ${activeTab.mode.toUpperCase()} code here...`}
              />
              {activeTab.mode === 'eml' && (compiled as any).errors && (compiled as any).errors.length > 0 && (
                <div className="p-4 bg-red-500/10 border-t border-red-500/20 text-red-500 text-xs font-mono">
                  <div className="font-bold mb-1 uppercase tracking-wider">Validation Errors:</div>
                  {(compiled as any).errors.map((err: string, idx: number) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className={`w-1/2 ${appTheme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#F5F5F4]'} flex flex-col`}>
              <div className={`h-10 px-4 border-b ${appTheme === 'dark' ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/50'} flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <Eye size={14} />
                  <span>Live Preview</span>
                </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:bg-white dark:hover:bg-white/10 transition-all border border-emerald-500/20"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy HTML'}</span>
              </button>
              <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-white/5 p-0.5 rounded-lg">
                <button onClick={() => setDeviceMode('desktop')} className={`p-1 rounded-md transition-all ${deviceMode === 'desktop' ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-600' : 'text-gray-400'}`}>
                  <Monitor size={14} />
                </button>
                <button onClick={() => setDeviceMode('mobile')} className={`p-1 rounded-md transition-all ${deviceMode === 'mobile' ? 'bg-white dark:bg-white/10 shadow-sm text-emerald-600' : 'text-gray-400'}`}>
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
              </div>
              
              <div className="flex-1 overflow-auto p-8 flex justify-center">
                <div 
                  className={`bg-white dark:bg-gray-900 shadow-2xl shadow-black/10 rounded-3xl overflow-hidden transition-all duration-500 ${deviceMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full max-w-4xl h-full'}`}
                >
                  <div className="h-8 bg-gray-50 dark:bg-black/20 border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/20 border border-red-400/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/20 border border-amber-400/30" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/20 border border-emerald-400/30" />
                    <div className="ml-4 flex-1 h-5 bg-white dark:bg-gray-800 rounded-md border border-black/5 dark:border-white/5 flex items-center px-3">
                      <span className="text-[10px] text-gray-400 truncate">{compiled.title}</span>
                    </div>
                  </div>
                  <div 
                    className={`p-10 overflow-auto h-[calc(100%-32px)] transition-colors duration-300 ${compiled.theme === 'dark' ? 'dark bg-gray-900' : 'bg-white'}`}
                    style={{ backgroundColor: compiled.bgColor || undefined }}
                  >
                    {activeTab.mode === 'eml' && emlView === 'xml' ? (
                      <pre className="p-8 h-full overflow-auto font-mono text-xs leading-relaxed opacity-80 whitespace-pre-wrap">
                        {activeTab.content}
                      </pre>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: compiled.html }} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className={`p-8 border-b ${appTheme === 'dark' ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white'} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ArrowRightLeft size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">EWL to HTML Converter</h2>
                  <p className="text-sm text-gray-500">Paste your EWL code to get usable HTML instantly</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={saveConverterToTab}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <Plus size={18} />
                  <span>Save as New Tab</span>
                </button>
                <button 
                  onClick={() => setView('playground')}
                  className={`p-2.5 rounded-xl transition-all ${appTheme === 'dark' ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-black/5 text-gray-600 hover:bg-black/10'}`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className={`w-1/2 border-r ${appTheme === 'dark' ? 'border-white/5' : 'border-black/5'} flex flex-col`}>
                <div className="p-4 bg-gray-50 dark:bg-black/20 text-[10px] font-bold uppercase tracking-widest text-gray-400">Input EWL Code</div>
                <textarea
                  value={converterInput}
                  onChange={(e) => setConverterInput(e.target.value)}
                  className={`flex-1 p-8 font-mono text-sm resize-none focus:outline-none bg-transparent ${appTheme === 'dark' ? 'text-emerald-50/90' : 'text-gray-800'}`}
                  placeholder="Paste your EWL code here starting with <EWL 1.0>..."
                />
              </div>
              <div className="w-1/2 flex flex-col bg-gray-50/50 dark:bg-black/40">
                <div className="p-4 bg-gray-100 dark:bg-black/30 text-[10px] font-bold uppercase tracking-widest text-gray-400 flex justify-between items-center">
                  <span>Generated HTML Output</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generateFullHtml(converterCompiled));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-500 transition-colors bg-white dark:bg-white/10 px-3 py-1 rounded-lg shadow-sm"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{copied ? 'Copied!' : 'Copy HTML'}</span>
                  </button>
                </div>
                <pre className={`flex-1 p-8 font-mono text-xs overflow-auto whitespace-pre-wrap ${appTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {generateFullHtml(converterCompiled)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl border ${appTheme === 'dark' ? 'bg-[#1A1A1A] border-white/5' : 'bg-white border-black/5'} flex flex-col`}
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600/10 text-emerald-600 rounded-xl flex items-center justify-center">
                    <Zap size={22} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{mode.toUpperCase()} Command Reference</h2>
                    <p className="text-xs text-gray-500">Master the {mode === 'ewl' ? 'Evo Web Language' : 'Evo Markup Language'} syntax</p>
                  </div>
                </div>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <div className="grid grid-cols-1 gap-3">
                  {(mode === 'ewl' ? COMMANDS : [
                    { cmd: '<eml>', desc: 'Root tag' },
                    { cmd: '<meta>', desc: 'Metadata container' },
                    { cmd: '<title>', desc: 'Page title' },
                    { cmd: '<content>', desc: 'Main content container' },
                    { cmd: '<title1>', desc: 'Big heading' },
                    { cmd: '<title2>', desc: 'Medium heading' },
                    { cmd: '<title3>', desc: 'Small heading' },
                    { cmd: '<text>', desc: 'Paragraph (supports **bold** and *italic*)' },
                    { cmd: '<link url="...">', desc: 'Hyperlink' },
                    { cmd: '<image src="..." width="..."/>', desc: 'Image' },
                    { cmd: '<button>', desc: 'Simple button' },
                    { cmd: '<list>', desc: 'Unordered list' },
                    { cmd: '<item>', desc: 'List item' }
                  ]).map((c, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${appTheme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-black/5'} flex items-center justify-between group hover:border-emerald-500/30 transition-all`}>
                      <div className="space-y-1">
                        <code className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">{c.cmd}</code>
                        <p className="text-xs text-gray-500">{c.desc}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
