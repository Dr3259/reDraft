
"use client";

import * as React from 'react';
import { useI18n, useCurrentLocale } from '@/locales/client';
import { Plus, Trash2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAutosave } from '@/hooks/useAutosave';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

const LOCAL_STORAGE_TREE_KEY = 'treeModeData_v1';

interface TreeNodeData {
  id: string;
  content: string;
  children: TreeNodeData[];
}

const initialTreeData: TreeNodeData[] = [
  { id: 'root-1', content: '中心主题', children: [] },
];

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
  isLastChildInLevel,
  themeTextColor
}) => {
  const t = useI18n();

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
        <GitBranch className="h-5 w-5 flex-shrink-0" style={{ color: themeTextColor }} />
        <Input
          value={node.content}
          onChange={(e) => onUpdate(node.id, e.target.value)}
          className="text-base font-medium border-none focus-visible:ring-1 focus-visible:ring-offset-0 flex-grow bg-transparent theme-placeholder"
          style={{ 
            color: themeTextColor,
            '--placeholder-color': themeTextColor,
            '--placeholder-opacity': '0.6',
           } as React.CSSProperties}
          placeholder={t('treeMode.nodePlaceholder')}
        />
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
      {node.children && node.children.length > 0 && (
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
  const [treeData, setTreeData] = useAutosave<TreeNodeData[]>(LOCAL_STORAGE_TREE_KEY, initialTreeData);

  const findNodeAndParent = (nodes: TreeNodeData[], nodeId: string, parent: TreeNodeData[] | null = null): { node: TreeNodeData | null; parent: TreeNodeData[] | null } => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return { node, parent };
      }
      const found = findNodeAndParent(node.children, nodeId, node.children);
      if (found.node) {
        return found;
      }
    }
    return { node: null, parent: null };
  };

  const updateNodeContent = (nodeId: string, content: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const { node } = findNodeAndParent(newTree, nodeId);
    if (node) {
      node.content = content;
      setTreeData(newTree);
    }
  };

  const addChildNode = (parentId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const { node: parentNode } = findNodeAndParent(newTree, parentId);
    if (parentNode) {
      const newNode: TreeNodeData = {
        id: `node-${Date.now()}-${Math.random()}`,
        content: t('treeMode.newNode'),
        children: [],
      };
      parentNode.children.push(newNode);
      setTreeData(newTree);
    }
  };
  
  const addSiblingNode = (nodeId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const { parent: parentArray } = findNodeAndParent(newTree, nodeId);
    
    if (parentArray) {
       const siblingIndex = parentArray.findIndex(n => n.id === nodeId);
       if (siblingIndex !== -1) {
          const newNode: TreeNodeData = {
            id: `node-${Date.now()}-${Math.random()}`,
            content: t('treeMode.newNode'),
            children: [],
          };
          parentArray.splice(siblingIndex + 1, 0, newNode);
          setTreeData(newTree);
       }
    }
  };

  const deleteNode = (nodeId: string) => {
    const newTree = JSON.parse(JSON.stringify(treeData));
    const { parent: parentArray } = findNodeAndParent(newTree, nodeId);
     if (parentArray) {
        const indexToDelete = parentArray.findIndex(n => n.id === nodeId);
        // Prevent deleting the last root node
        if (parentArray === newTree && newTree.length === 1) {
            return;
        }
        if (indexToDelete !== -1) {
            parentArray.splice(indexToDelete, 1);
            setTreeData(newTree);
        }
    }
  };
  
  const addRootNode = () => {
    setTreeData(prevTree => [
      ...prevTree,
      {
        id: `root-${Date.now()}`,
        content: t('treeMode.newRootNode'),
        children: [],
      }
    ]);
  };

  return (
    <div 
      className="relative flex flex-col h-full overflow-hidden" 
      style={{ backgroundColor: themeBackgroundColor, color: themeTextColor }}
    >
      <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0" style={{ borderColor: 'hsl(var(--border))' }}>
        <h1 className="text-xl font-semibold">{t('appModes.tree')}</h1>
        <Button onClick={addRootNode}>
          <Plus className="mr-2 h-4 w-4" />
          {t('treeMode.addRootNode')}
        </Button>
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
                  isLastChildInLevel={index === treeData.length - 1}
                  themeTextColor={themeTextColor}
                />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}

