import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Copy, Check, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  initialCode: string;
  language?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  initialCode, 
  language = 'javascript',
  readOnly = false 
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const runCode = () => {
    setIsRunning(true);
    setOutput('');

    try {
      // Create a custom console.log that captures output
      let outputs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          outputs.push(args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '));
        },
        error: (...args: any[]) => {
          outputs.push('Error: ' + args.join(' '));
        }
      };

      // Execute the code with custom console
      const func = new Function('console', code);
      func(customConsole);

      setOutput(outputs.join('\n') || 'Kode berhasil dijalankan!');
    } catch (error: any) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Kode Disalin!',
      description: 'Kode berhasil disalin ke clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
  };

  const lines = code.split('\n');

  return (
    <div className="rounded-2xl overflow-hidden glass border border-border/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-muted-foreground ml-2">{language}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetCode}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={copyCode}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="hero" size="sm" onClick={runCode} disabled={isRunning}>
            <Play className="h-4 w-4 mr-1" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex bg-[hsl(var(--code-bg))]">
        {/* Line Numbers */}
        <div className="py-4 px-3 text-right select-none border-r border-border/30">
          {lines.map((_, i) => (
            <div key={i} className="text-muted-foreground/50 text-sm font-mono leading-6">
              {i + 1}
            </div>
          ))}
        </div>
        
        {/* Code Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={readOnly}
          className="flex-1 p-4 bg-transparent text-[hsl(var(--code-text))] font-mono text-sm resize-none focus:outline-none min-h-[200px] leading-6"
          spellCheck={false}
        />
      </div>

      {/* Output */}
      {output && (
        <div className="border-t border-border/50 bg-muted/20">
          <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border/30">
            Output
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap text-foreground">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
