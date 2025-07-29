import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, File, Play, Image, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatFileSize } from '@/lib/utils'

const FileItem = ({ item, level = 0, onFileSelect, selectedFile, completedFiles, onMarkComplete }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0)
  const isCompleted = completedFiles.includes(item.path)
  const isSelected = selectedFile?.path === item.path

  if (item.type === 'folder') {
    return (
      <div className="select-none">
        <div
          className={cn(
            "flex items-center py-2 px-3 hover:bg-white/5 cursor-pointer rounded-md transition-colors",
            "text-gray-300 hover:text-white"
          )}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 mr-2 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
          )}
          <Folder className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
          <span className="truncate font-medium">{item.name}</span>
        </div>
        
        {isExpanded && item.children && (
          <div className="ml-2">
            {item.children.map((child, index) => (
              <FileItem
                key={`${child.path}-${index}`}
                item={child}
                level={level + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                completedFiles={completedFiles}
                onMarkComplete={onMarkComplete}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (item.type === 'file') {
    const canPlay = item.isVideo || item.isImage
    
    return (
      <div
        className={cn(
          "flex items-center py-2 px-3 hover:bg-white/5 cursor-pointer rounded-md transition-colors group",
          isSelected && "bg-lime-500/20 border-l-2 border-lime-400",
          isCompleted && "opacity-75",
          canPlay ? "text-gray-300 hover:text-white" : "text-gray-500"
        )}
        style={{ paddingLeft: `${level * 20 + 32}px` }}
        onClick={() => canPlay && onFileSelect(item)}
      >
        <div className="flex items-center flex-1 min-w-0">
          {item.isVideo ? (
            <Play className="w-4 h-4 mr-2 flex-shrink-0 text-green-400" />
          ) : item.isImage ? (
            <Image className="w-4 h-4 mr-2 flex-shrink-0 text-purple-400" />
          ) : (
            <File className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className={cn(
                "truncate text-sm",
                isCompleted && "line-through"
              )}>
                {item.name}
              </span>
              {isCompleted && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-400 flex-shrink-0" />
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatFileSize(item.size)}
            </div>
          </div>
        </div>
        
        {item.isVideo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onMarkComplete(item.path)
            }}
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0",
              isCompleted ? "text-green-400" : "text-gray-400 hover:text-green-400"
            )}
          >
            <CheckCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  return null
}

const FileExplorer = ({ files, onFileSelect, selectedFile, completedFiles, onMarkComplete }) => {
  return (
    <div className="h-full overflow-y-auto bg-gray-900/50 rounded-lg p-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{ maxHeight: '100%' }}>
      <div className="space-y-1 pb-4">
        {files.map((item, index) => (
          <FileItem
            key={`${item.path}-${index}`}
            item={item}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            completedFiles={completedFiles}
            onMarkComplete={onMarkComplete}
          />
        ))}
      </div>
    </div>
  )
}

export default FileExplorer