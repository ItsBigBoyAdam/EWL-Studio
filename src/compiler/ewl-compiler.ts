/**
 * EWL Compiler Logic
 */

import { compileEML } from './eml-compiler';

export interface CompilerResult {
  html: string;
  title: string;
  theme: 'light' | 'dark';
  bgColor: string;
  cssLinks: string[];
  jsLinks: string[];
  phpLinks: string[];
}

export function compileEWL(input: string): CompilerResult {
  let title = "EWL Page";
  let theme: 'light' | 'dark' = 'light';
  let bgColor = "";
  const cssLinks: string[] = [];
  const jsLinks: string[] = [];
  const phpLinks: string[] = [];
  
  // Extract content between <start> and <end>
  const startTag = "<start>";
  const endTag = "<end>";
  const startIndex = input.indexOf(startTag);
  const endIndex = input.lastIndexOf(endTag);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return { 
      html: "<p class='text-red-500'>Error: EWL code must be between &lt;start&gt; and &lt;end&gt;</p>", 
      title, 
      theme, 
      bgColor,
      cssLinks,
      jsLinks,
      phpLinks: []
    };
  }

  const content = input.substring(startIndex + startTag.length, endIndex).trim();
  
  // Parse lines and blocks
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Pre-parse for page-level settings
  lines.forEach(line => {
    const tabMatch = line.match(/tab\s+"([^"]+)"/);
    if (tabMatch) title = tabMatch[1];

    const themeMatch = line.match(/theme\s+(light|dark)/);
    if (themeMatch) theme = themeMatch[1] as 'light' | 'dark';

    const bgMatch = line.match(/bg_color\s+"([^"]+)"/);
    if (bgMatch) bgColor = bgMatch[1];

    const cssMatch = line.match(/link_css\s+"([^"]+)"/);
    if (cssMatch) cssLinks.push(cssMatch[1]);

    const jsMatch = line.match(/link_js\s+"([^"]+)"/);
    if (jsMatch) jsLinks.push(jsMatch[1]);

    const phpMatch = line.match(/link_php\s+"([^"]+)"/);
    if (phpMatch) phpLinks.push(phpMatch[1]);
  });

  const parsedHtml = parseBlocks(lines);

  return { 
    html: parsedHtml, 
    title, 
    theme, 
    bgColor,
    cssLinks,
    jsLinks,
    phpLinks
  };
}

function parseBlocks(lines: string[]): string {
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Handle Blocks
    if (line.startsWith("card {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      html += `<div class="ewl-card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 mb-4 space-y-3">${parseBlocks(blockLines)}</div>`;
      continue;
    }

    if (line.startsWith("navbar_h {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      html += `<nav class="ewl-navbar-h flex flex-row flex-wrap gap-6 items-center mb-8 p-4 bg-white/50 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/5 dark:border-white/5">${parseBlocks(blockLines)}</nav>`;
      continue;
    }

    if (line.startsWith("navbar_v {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      html += `<nav class="ewl-navbar-v flex flex-col gap-3 mb-8 p-6 bg-white/50 dark:bg-white/5 rounded-2xl backdrop-blur-sm border border-black/5 dark:border-white/5">${parseBlocks(blockLines)}</nav>`;
      continue;
    }

    if (line.startsWith("row {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      html += `<div class="ewl-row grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">${parseBlocks(blockLines)}</div>`;
      continue;
    }

    if (line.startsWith("list {")) {
      const items: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) items.push(lines[i]);
        i++;
      }
      html += `<ul class="ewl-list list-disc pl-6 mb-4 space-y-1">${items.map(item => `<li class="text-gray-700 dark:text-gray-300">${processInline(item)}</li>`).join('')}</ul>`;
      continue;
    }

    if (line.startsWith("form {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      html += `<form class="ewl-form space-y-4 mb-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-black/5 dark:border-white/5">${parseBlocks(blockLines)}</form>`;
      continue;
    }

    if (line.startsWith("php_loop ")) {
      const tableMatch = line.match(/php_loop\s+"([^"]+)"/);
      const tableName = tableMatch ? tableMatch[1] : "data";
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      
      // In preview, we just show a placeholder
      html += `<div class="ewl-php-loop border-2 border-dashed border-purple-500/30 p-4 rounded-2xl mb-4 relative overflow-hidden">
        <div class="absolute top-0 right-0 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold uppercase">PHP Loop: ${tableName}</div>
        ${parseBlocks(blockLines)}
      </div>`;
      continue;
    }

    if (line.startsWith("eml {")) {
      const blockLines: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) blockLines.push(lines[i]);
        i++;
      }
      const emlContent = blockLines.join('\n');
      const emlResult = compileEML(emlContent);
      html += `<div class="ewl-eml-embed p-4 border border-emerald-500/20 rounded-2xl mb-4">${emlResult.html}</div>`;
      continue;
    }

    if (line.startsWith("audio {")) {
      const items: string[] = [];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        if (lines[i].includes("{")) depth++;
        if (lines[i].includes("}")) depth--;
        if (depth > 0) items.push(lines[i]);
        i++;
      }
      const src = items[0]?.replace(/"/g, '') || '';
      html += `<audio controls src="${src}" class="ewl-audio w-full mb-4"></audio>`;
      continue;
    }

    // Handle Single Commands
    html += parseCommand(line);
    i++;
  }

  return html;
}

function parseCommand(line: string): string {
  // Ignore page-level commands in general parsing
  if (line.match(/^(tab|theme|bg_color|link_css|link_js|link_php)\s+/)) return "";

  // <p1> "Big Title"
  const p1Match = line.match(/<p1>\s+"([^"]+)"/);
  if (p1Match) return `<h1 class="ewl-h1 text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">${processInline(p1Match[1])}</h1>`;

  // <p2> "Medium Title"
  const p2Match = line.match(/<p2>\s+"([^"]+)"/);
  if (p2Match) return `<h2 class="ewl-h2 text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-100 mb-4">${processInline(p2Match[1])}</h2>`;

  // <p3> "Small Title"
  const p3Match = line.match(/<p3>\s+"([^"]+)"/);
  if (p3Match) return `<h3 class="ewl-h3 text-xl font-medium text-gray-700 dark:text-gray-200 mb-3">${processInline(p3Match[1])}</h3>`;

  // text "Hello World"
  const textMatch = line.match(/text\s+"([^"]+)"/);
  if (textMatch) return `<p class="ewl-text text-gray-600 dark:text-gray-400 leading-relaxed mb-4">${processInline(textMatch[1])}</p>`;

  // link "https://example.com"
  const linkMatch = line.match(/link\s+"([^"]+)"/);
  if (linkMatch) return `<a href="${linkMatch[1]}" target="_blank" class="ewl-link text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block">${linkMatch[1]}</a>`;

  // image "image.png" width 200
  const imageWidthMatch = line.match(/image\s+"([^"]+)"\s+width\s+(\d+)/);
  if (imageWidthMatch) return `<img src="${imageWidthMatch[1]}" style="width: ${imageWidthMatch[2]}px" class="ewl-img rounded-xl mb-4" referrerPolicy="no-referrer" />`;
  
  const imageMatch = line.match(/image\s+"([^"]+)"/);
  if (imageMatch) return `<img src="${imageMatch[1]}" class="ewl-img max-w-full h-auto rounded-xl mb-4" referrerPolicy="no-referrer" />`;

  // button_link "Click Me" -> "url"
  const btnLinkMatch = line.match(/button_link\s+"([^"]+)"\s*(?:->|=>)\s*"([^"]+)"/);
  if (btnLinkMatch) return `<a href="${btnLinkMatch[2]}" target="_blank" class="ewl-button-link inline-flex items-center justify-center px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors mb-4 no-underline">${processInline(btnLinkMatch[1])}</a>`;

  // link_title "Home" -> "url"
  const linkTitleMatch = line.match(/link_title\s+"([^"]+)"\s*(?:->|=>)\s*"([^"]+)"/);
  if (linkTitleMatch) return `<a href="${linkTitleMatch[2]}" class="ewl-link-title text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors no-underline">${processInline(linkTitleMatch[1])}</a>`;

  // button "Click Me"
  const btnMatch = line.match(/button\s+"([^"]+)"/);
  if (btnMatch) return `<button class="ewl-button px-6 py-2 bg-gray-900 dark:bg-emerald-600 text-white font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-emerald-700 transition-colors mb-4">${processInline(btnMatch[1])}</button>`;

  // input "Your Name"
  const inputMatch = line.match(/input\s+"([^"]+)"/);
  if (inputMatch) return `<div class="space-y-1.5"><label class="text-xs font-bold uppercase tracking-wider text-gray-400">${inputMatch[1]}</label><input type="text" placeholder="${inputMatch[1]}" class="ewl-input w-full px-4 py-2 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>`;

  // checkbox "I agree"
  const checkboxMatch = line.match(/checkbox\s+"([^"]+)"/);
  if (checkboxMatch) return `<label class="ewl-checkbox-label flex items-center gap-3 cursor-pointer group"><input type="checkbox" class="w-5 h-5 rounded-lg border-black/5 dark:border-white/10 text-emerald-600 focus:ring-emerald-500/20" /><span class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">${processInline(checkboxMatch[1])}</span></label>`;

  // iframe "example.com" width: 150
  const iframeMatch = line.match(/iframe\s+"([^"]+)"\s+width:\s+(\d+)/);
  if (iframeMatch) return `<iframe src="${iframeMatch[1]}" width="${iframeMatch[2]}" height="300" class="ewl-iframe rounded-xl border border-black/5 dark:border-white/5 mb-4"></iframe>`;

  // video "video.mp4"
  const videoMatch = line.match(/video\s+"([^"]+)"/);
  if (videoMatch) return `<video src="${videoMatch[1]}" controls class="ewl-video w-full rounded-xl mb-4"></video>`;

  return "";
}

function processInline(text: string): string {
  // Bold: **text**
  let processed = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return processed;
}

/**
 * Generates a standalone HTML document string.
 */
export function generateFullHtml(result: CompilerResult): string {
  const cssLinks = result.cssLinks.map(link => `<link rel="stylesheet" href="${link}">`).join('\n');
  const jsLinks = result.jsLinks.map(link => `<script src="${link}"></script>`).join('\n');
  
  return `<!DOCTYPE html>
<html lang="en" class="${result.theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${result.title}</title>
    <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
    ${cssLinks}
    <style>
        body {
            background-color: ${result.bgColor || (result.theme === 'dark' ? '#111827' : '#F9FAFB')};
            min-height: 100vh;
            padding: 2rem;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        ${result.html}
    </div>
    ${jsLinks}
</body>
</html>`;
}

/**
 * Generates a standalone PHP document string.
 */
export function generateFullPhp(result: CompilerResult): string {
  const phpIncludes = result.phpLinks.map(link => `<?php include_once("${link}"); ?>`).join('\n');
  
  // Replace loop placeholders with actual PHP code
  let phpBody = result.html;
  
  // Simple regex to find our loop placeholders and convert them
  // This is a basic implementation for the demo
  phpBody = phpBody.replace(/<div class="ewl-php-loop[^>]*>.*?PHP Loop: ([^<]+)<\/div>(.*?)<\/div>/gs, (match, table, inner) => {
    return `<?php 
    $query = "SELECT * FROM ${table}";
    $result = mysqli_query($conn, $query);
    if($result) {
      while($row = mysqli_fetch_assoc($result)) { 
    ?>
    ${inner}
    <?php 
      }
    } 
    ?>`;
  });

  // Replace variable placeholders like {{row['name']}} with PHP echo
  phpBody = phpBody.replace(/\{\{([^}]+)\}\}/g, '<?php echo $$1; ?>');

  const html = generateFullHtml({ ...result, html: phpBody });
  return `${phpIncludes}\n${html}`;
}
