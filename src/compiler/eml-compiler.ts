
export interface EmlResult {
  xml: string;
  html: string;
  title: string;
  errors: string[];
}

export function compileEML(input: string): EmlResult {
  const errors: string[] = [];
  let title = "EML Page";
  let html = "";

  // Basic XML validation (very simple stack-based)
  const validateXml = (xml: string) => {
    const stack: string[] = [];
    const tagRegex = /<(\/?[a-zA-Z0-9]+)([^>]*)>/g;
    let match;
    
    while ((match = tagRegex.exec(xml)) !== null) {
      const tag = match[1];
      const isClosing = tag.startsWith('/');
      const isSelfClosing = match[0].endsWith('/>');

      if (isSelfClosing) continue;

      if (isClosing) {
        const tagName = tag.substring(1);
        if (stack.length === 0 || stack[stack.length - 1] !== tagName) {
          errors.push(`Unexpected closing tag: </${tagName}>`);
        } else {
          stack.pop();
        }
      } else {
        stack.push(tag);
      }
    }

    while (stack.length > 0) {
      errors.push(`Missing closing tag for: <${stack.pop()}>`);
    }
  };

  validateXml(input);

  // Helper to parse formatting inside text
  const parseFormatting = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  };

  // Convert EML to HTML
  const convertToHtml = (xml: string) => {
    let result = "";
    
    // Extract title
    const titleMatch = xml.match(/<title>(.*?)<\/title>/);
    if (titleMatch) title = titleMatch[1];

    // Extract content
    const contentMatch = xml.match(/<content>([\s\S]*?)<\/content>/);
    if (contentMatch) {
      const content = contentMatch[1];
      
      // Process tags inside content
      const lines = content.split('\n');
      let inList = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // Title1
        if (line.includes('<title1>')) {
          result += `<h1 class="text-4xl font-black tracking-tight mb-6">${line.replace(/<\/?title1>/g, '')}</h1>`;
        }
        // Title2
        else if (line.includes('<title2>')) {
          result += `<h2 class="text-2xl font-bold tracking-tight mb-4 mt-8">${line.replace(/<\/?title2>/g, '')}</h2>`;
        }
        // Title3
        else if (line.includes('<title3>')) {
          result += `<h3 class="text-xl font-bold mb-3 mt-6">${line.replace(/<\/?title3>/g, '')}</h3>`;
        }
        // Text
        else if (line.includes('<text>')) {
          const textContent = line.replace(/<\/?text>/g, '');
          result += `<p class="text-lg leading-relaxed mb-4 opacity-90">${parseFormatting(textContent)}</p>`;
        }
        // Link
        else if (line.includes('<link')) {
          const urlMatch = line.match(/url="([^"]+)"/);
          const url = urlMatch ? urlMatch[1] : "#";
          const text = line.replace(/<link[^>]*>|<\/link>/g, '');
          result += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline font-medium mb-4 inline-block">${text}</a>`;
        }
        // Image
        else if (line.includes('<image')) {
          const srcMatch = line.match(/src="([^"]+)"/);
          const widthMatch = line.match(/width="([^"]+)"/);
          const src = srcMatch ? srcMatch[1] : "";
          const width = widthMatch ? widthMatch[1] : "auto";
          result += `<img src="${src}" style="width: ${width}px" class="rounded-2xl shadow-lg mb-6" referrerPolicy="no-referrer" />`;
        }
        // Button
        else if (line.includes('<button>')) {
          result += `<button class="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 mb-6">${line.replace(/<\/?button>/g, '')}</button>`;
        }
        // List
        else if (line.includes('<list>')) {
          inList = true;
          result += `<ul class="space-y-2 mb-6 ml-4">`;
        }
        else if (line.includes('</list>')) {
          inList = false;
          result += `</ul>`;
        }
        else if (line.includes('<item>')) {
          result += `<li class="flex items-center gap-2 opacity-80"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>${line.replace(/<\/?item>/g, '')}</li>`;
        }
      }
    }

    return result;
  };

  html = convertToHtml(input);

  return {
    xml: input,
    html,
    title,
    errors
  };
}
