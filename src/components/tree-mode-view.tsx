
"use client";

import * as React from 'react';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { Plus, Trash2, GitBranch, FolderClock, FileSignature, Download, FileJson, FileText, FileType, ChevronRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const LOCAL_STORAGE_TREE_DRAFTS_KEY = 'treeModeDrafts_v1';

interface TreeNodeData {
  id: string;
  content: string;
  isExpanded: boolean;
  children: TreeNodeData[];
}

const initialTreeData: TreeNodeData[] = [
  { id: 'root-1', content: '中心主题', isExpanded: true, children: [] },
];

interface SavedTreeDraft {
  id: string;
  name: string;
  data: TreeNodeData[];
  createdAt: string;
}

interface TreeModeViewProps {
  themeBackgroundColor: string;
  themeTextColor: string;
}

// === Recursive TreeNode Component ===
interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  onUpdate: (id: string, content: string) => void;
  onAddChild: (parentId: string) => void;
  onAddSibling: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  isLastChildInLevel: boolean;
  themeTextColor: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  onUpdate, 
  onAddChild, 
  onAddSibling,
  onDelete,
  onToggleExpand,
  isLastChildInLevel,
  themeTextColor
}) => {
  const t = useI18n();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (node.content === t('treeMode.newNode') || node.content === t('treeMode.newRootNode')) {
        inputRef.current?.focus();
        inputRef.current?.select();
    }
  }, [node.content, t]);


  return (
    <div className="relative pl-8">
      {/* Connection Lines */}
      <div className={cn(
        "absolute top-0 left-0 h-full w-px bg-border",
        isLastChildInLevel && "h-7" // Shorten line if it's the last child
      )}></div>
      <div className="absolute top-7 left-0 h-px w-8 bg-border"></div>

      {/* Node Content & Actions */}
      <div className="flex items-center space-x-2 py-2">
         {node.children.length > 0 ? (
          <ChevronRight 
            className={cn("h-5 w-5 flex-shrink-0 cursor-pointer transition-transform", node.isExpanded && "rotate-90")}
            style={{ color: themeTextColor }}
            onClick={() => onToggleExpand(node.id)}
          />
        ) : (
          <GitBranch className="h-5 w-5 flex-shrink-0" style={{ color: themeTextColor }} />
        )}
        <div className="flex-grow min-w-0">
          <Input
            ref={inputRef}
            value={node.content}
            onChange={(e) => onUpdate(node.id, e.target.value)}
            className={cn(
              "border-none focus-visible:ring-1 focus-visible:ring-offset-0 w-full bg-transparent theme-placeholder",
              level === 0 ? "text-lg font-semibold" : "text-base font-normal"
            )}
            style={{ 
              color: themeTextColor,
              '--placeholder-color': themeTextColor,
              '--placeholder-opacity': '0.6',
            } as React.CSSProperties}
            placeholder={t('treeMode.nodePlaceholder')}
          />
        </div>
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddChild(node.id)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('treeMode.addChildTooltip')}</p></TooltipContent>
            </Tooltip>
            {level > 0 && (
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddSibling(node.id)}>
                         <GitBranch className="h-4 w-4 transform rotate-90" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{t('treeMode.addSiblingTooltip')}</p></TooltipContent>
              </Tooltip>
            )}
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(node.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{t('treeMode.deleteNodeTooltip')}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Children Nodes */}
      {node.isExpanded && node.children && node.children.length > 0 && (
        <div className="border-l border-border">
          {node.children.map((childNode, index) => (
            <TreeNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              onUpdate={onUpdate}
              onAddChild={onAddChild}
              onAddSibling={onAddSibling}
              onDelete={onDelete}
              onToggleExpand={onToggleExpand}
              isLastChildInLevel={index === node.children.length - 1}
              themeTextColor={themeTextColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// === Main Tree Mode View ===
export function TreeModeView({ themeBackgroundColor, themeTextColor }: TreeModeViewProps) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const { toast, dismiss: dismissToast } = useToast();

  const [treeData, setTreeData] = React.useState<TreeNodeData[]>(initialTreeData);
  const [drafts, setDrafts] = React.useState<SavedTreeDraft[]>([]);
  const [isDraftsDialogOpen, setIsDraftsDialogOpen] = React.useState(false);
  
  React.useEffect(() => {
    const loadDrafts = () => {
      const savedDraftsJson = localStorage.getItem(LOCAL_STORAGE_TREE_DRAFTS_KEY);
      if (savedDraftsJson) {
        try {
          const parsedDrafts: SavedTreeDraft[] = JSON.parse(savedDraftsJson);
          setDrafts(parsedDrafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
          console.error("Error parsing tree drafts from localStorage:", e);
          localStorage.removeItem(LOCAL_STORAGE_TREE_DRAFTS_KEY);
        }
      }
    };
    loadDrafts();
  }, []);

  const findNodeAndParentRecursive = (nodes: TreeNodeData[], nodeId: string, parent: TreeNodeData[] | null = null, parentNode: TreeNodeData | null = null): { node: TreeNodeData | null; parent: TreeNodeData[] | null, parentNode: TreeNodeData | null } => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return { node, parent, parentNode };
      }
      const found = findNodeAndParentRecursive(node.children, nodeId, node.children, node);
      if (found.node) {
        return found;
      }
    }
    return { node: null, parent: null, parentNode: null };
  };

  const findNodeRecursive = (nodes: TreeNodeData[], nodeId: string): TreeNodeData | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        const found = findNodeRecursive(node.children, nodeId);
        if (found) return found;
      }
      return null;
  };

  const updateNodeContent = (nodeId: string, content: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const node = findNodeRecursive(newTree, nodeId);
    if (node) {
      node.content = content;
      setTreeData(newTree);
    }
  };

  const addChildNode = (parentId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const parentNode = findNodeRecursive(newTree, parentId);
    if (parentNode) {
      const newNode: TreeNodeData = {
        id: `node-${Date.now()}-${Math.random()}`,
        content: t('treeMode.newNode'),
        isExpanded: true,
        children: [],
      };
      parentNode.children.push(newNode);
      parentNode.isExpanded = true;
      setTreeData(newTree);
    }
  };
  
  const addSiblingNode = (nodeId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const { parent: parentArray } = findNodeAndParentRecursive(newTree, nodeId);
    
    if (parentArray) {
       const siblingIndex = parentArray.findIndex(n => n.id === nodeId);
       if (siblingIndex !== -1) {
          const newNode: TreeNodeData = {
            id: `node-${Date.now()}-${Math.random()}`,
            content: t('treeMode.newNode'),
            isExpanded: true,
            children: [],
          };
          parentArray.splice(siblingIndex + 1, 0, newNode);
          setTreeData(newTree);
       }
    }
  };

  const deleteNode = (nodeId: string) => {
    let newTree = JSON.parse(JSON.stringify(treeData));
    const { parent: parentArray, node: nodeToDelete } = findNodeAndParentRecursive(newTree, nodeId);
  
    if (parentArray && nodeToDelete) {
      const indexToDelete = parentArray.findIndex(n => n.id === nodeId);
      if (indexToDelete !== -1) {
        parentArray.splice(indexToDelete, 1);
        if (newTree.length === 0) {
            newTree = [{ id: 'root-1', content: t('treeMode.newRootNode'), isExpanded: true, children: [] }];
            toast({
                variant: 'default',
                title: t('treeMode.deleteLastErrorTitle'),
                description: t('treeMode.deleteLastErrorDescription'),
                duration: 3000
            });
        }
        setTreeData(newTree);
      }
    } else if (treeData.some(n => n.id === nodeId) && treeData.length > 1) {
        newTree = treeData.filter(n => n.id !== nodeId);
        setTreeData(newTree);
    } else if (treeData.length === 1 && treeData[0].id === nodeId) {
         toast({
            variant: 'destructive',
            title: t('treeMode.deleteLastErrorTitle'),
            description: t('treeMode.deleteLastErrorDescription')
        });
    }
  };
  
  const addRootNode = () => {
    setTreeData(prevTree => [
      ...prevTree,
      {
        id: `root-${Date.now()}`,
        content: t('treeMode.newRootNode'),
        isExpanded: true,
        children: [],
      }
    ]);
  };
  
  const toggleNodeExpansion = (nodeId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const node = findNodeRecursive(newTree, nodeId);
    if (node) {
      node.isExpanded = !node.isExpanded;
      setTreeData(newTree);
    }
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const generatePlainTextTree = (nodes: TreeNodeData[], indent: string = ''): string => {
    let text = '';
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      text += `${indent}${isLast ? '└─' : '├─'} ${node.content}\n`;
      if (node.isExpanded) {
        text += generatePlainTextTree(node.children, `${indent}${isLast ? '    ' : '│   '}`);
      }
    });
    return text;
  };
  
  const generateMarkdownTree = (nodes: TreeNodeData[], level = 0): string => {
    let md = '';
    nodes.forEach(node => {
      md += `${'  '.repeat(level)}- ${node.content}\n`;
      if (node.isExpanded && node.children && node.children.length > 0) {
        md += generateMarkdownTree(node.children, level + 1);
      }
    });
    return md;
  };


  const handleExport = (format: 'txt' | 'json' | 'md') => {
    if (!treeData || treeData.length === 0 || (treeData.length === 1 && !treeData[0].content && treeData[0].children.length === 0)) {
        toast({ variant: "destructive", title: t('export.emptyNoteErrorTitle'), description: t('export.emptyTreeErrorDescription') });
        return;
    }

    const firstNodeName = treeData[0]?.content.trim().replace(/\s+/g, '_') || 'untitled_tree';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filenameBase = `tree-${firstNodeName}-${timestamp}`;

    if (format === 'json') {
        const filename = `${filenameBase}.json`;
        downloadFile(filename, JSON.stringify(treeData, null, 2), 'application/json');
        toast({ title: t('toast.exportedAs', { format: '.json' }), description: t('toast.downloadedDescription', {filename}) });
    } else if (format === 'txt') {
        const filename = `${filenameBase}.txt`;
        const textContent = generatePlainTextTree(treeData);
        downloadFile(filename, textContent, 'text/plain;charset=utf-8');
        toast({ title: t('toast.exportedAs', { format: '.txt' }), description: t('toast.downloadedDescription', {filename}) });
    } else if (format === 'md') {
        const filename = `${filenameBase}.md`;
        const mdContent = generateMarkdownTree(treeData);
        downloadFile(filename, mdContent, 'text/markdown;charset=utf-8');
        toast({ title: t('toast.exportedAs', { format: '.md' }), description: t('toast.downloadedDescription', {filename}) });
    }
  };

  const handleCopyToClipboard = () => {
    if (!treeData || treeData.length === 0 || (treeData.length === 1 && !treeData[0].content && treeData[0].children.length === 0)) {
        toast({ variant: "destructive", title: t('export.emptyNoteErrorTitle'), description: t('export.emptyTreeErrorDescription') });
        return;
    }
    const mdContent = generateMarkdownTree(treeData);
    navigator.clipboard.writeText(mdContent).then(() => {
        toast({ title: t('treeMode.copySuccessTitle'), description: t('treeMode.copySuccessDescription') });
    }).catch(err => {
        console.error('Failed to copy: ', err);
        toast({ variant: "destructive", title: t('treeMode.copyErrorTitle'), description: t('treeMode.copyErrorDescription') });
    });
  };


  const handleSaveTreeDraft = () => {
    if (!treeData || treeData.length === 0) {
        toast({ variant: "destructive", title: t('treeMode.emptyTreeErrorTitle'), description: t('treeMode.emptyTreeErrorDescription') });
        return;
    }

    const draftName = `${t('treeMode.draftNamePrefix')} - ${treeData[0]?.content || 'Untitled'}`;
    const newDraft: SavedTreeDraft = {
      id: Date.now().toString(),
      name: draftName,
      data: treeData,
      createdAt: new Date().toISOString(),
    };

    const updatedDrafts = [newDraft, ...drafts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    try {
      localStorage.setItem(LOCAL_STORAGE_TREE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      toast({ title: t('treeMode.draftSavedTitle'), description: t('treeMode.draftSavedDescription', { draftName: newDraft.name }) });
    } catch (error) {
      console.error("Error saving tree draft:", error);
      toast({ variant: "destructive", title: t('treeMode.draftSaveErrorTitle'), description: t('treeMode.draftSaveErrorDescription') });
    }
  };

  const handleLoadTreeDraft = (draftId: string) => {
    const draftToLoad = drafts.find(d => d.id === draftId);
    if (draftToLoad) {
      setTreeData(draftToLoad.data);
      toast({ title: t('treeMode.draftLoadedTitle'), description: t('treeMode.draftLoadedDescription', { draftName: draftToLoad.name }) });
      setIsDraftsDialogOpen(false);
    }
  };

  const handleDeleteTreeDraft = (draftId: string) => {
    const draftToDelete = drafts.find(d => d.id === draftId);
    if (!draftToDelete) return;
    
    const updatedDrafts = drafts.filter(d => d.id !== draftId);
    localStorage.setItem(LOCAL_STORAGE_TREE_DRAFTS_KEY, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
    toast({ title: t('treeMode.draftDeletedTitle'), description: t('treeMode.draftDeletedDescription', { draftName: draftToDelete.name }) });
  };


  return (
    <div 
      className="relative flex flex-col h-full overflow-hidden" 
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0 pr-40" style={{ borderColor: 'hsl(var(--border))' }}>
        <h1 className="text-xl font-semibold mr-4 flex-shrink-0">{t('appModes.tree')}</h1>
        <div className="flex items-center space-x-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                            <Copy className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t('treeMode.copyTooltip')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button onClick={addRootNode} className="flex-shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('treeMode.addRootNode')}
            </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4 md:p-8">
        <div className="space-y-4">
            {treeData.map((rootNode, index) => (
               <TreeNode
                  key={rootNode.id}
                  node={rootNode}
                  level={0}
                  onUpdate={updateNodeContent}
                  onAddChild={addChildNode}
                  onAddSibling={addSiblingNode}
                  onDelete={deleteNode}
                  onToggleExpand={toggleNodeExpansion}
                  isLastChildInLevel={index === treeData.length - 1}
                  themeTextColor={themeTextColor}
                />
            ))}
        </div>
      </ScrollArea>
       <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  aria-label={t('export.title')} 
                  className="hover:bg-white/20 focus-visible:ring-1 focus-visible:ring-white/40"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('txt')}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t('export.txt')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('md')}>
                  <FileType className="mr-2 h-4 w-4" />
                  <span>{t('export.md')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')}>
                  <FileJson className="mr-2 h-4 w-4" />
                  <span>{t('export.json')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDraftsDialogOpen(true)} 
                  aria-label={t('treeMode.manageDraftsTooltip')}
                  className="hover:bg-white/20 focus-visible:ring-1 focus-visible:ring-white/40"
                >
                  <FolderClock className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('treeMode.manageDraftsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleSaveTreeDraft} 
                  aria-label={t('treeMode.saveDraftTooltip')}
                  className="hover:bg-white/20 focus-visible:ring-1 focus-visible:ring-white/40"
                >
                  <FileSignature className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('treeMode.saveDraftTooltip')}</p>
              </TooltipContent>
            </Tooltip>
        </TooltipProvider>
       </div>
       
      <Dialog open={isDraftsDialogOpen} onOpenChange={setIsDraftsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('treeMode.draftsDialogTitle')}</DialogTitle>
            <DialogDescription>
              {drafts.length > 0 ? t('treeMode.draftsDialogDescription') : t('treeMode.noDraftsMessage')}
            </DialogDescription>
          </DialogHeader>
          {drafts.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-4">
                {drafts.map((draft) => (
                  <div key={draft.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent space-x-3">
                    <div className="flex-grow min-w-0">
                      <p className="font-medium truncate">{draft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(draft.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoadTreeDraft(draft.id)}>
                        {t('treeMode.loadDraftButton')}
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDeleteTreeDraft(draft.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('treeMode.deleteDraftTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('treeMode.closeDialogButton')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    