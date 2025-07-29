import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utility to process file list from input
export function processFileList(fileList) {
  const files = Array.from(fileList)
  const fileTree = {}
  
  // Build file tree structure
  files.forEach(file => {
    const pathParts = file.webkitRelativePath.split('/')
    let currentLevel = fileTree
    
    // Build nested structure
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i]
      if (!currentLevel[folderName]) {
        currentLevel[folderName] = {
          type: 'folder',
          name: folderName,
          path: pathParts.slice(0, i + 1).join('/'),
          children: {}
        }
      }
      currentLevel = currentLevel[folderName].children
    }
    
    // Add file to structure
    const fileName = pathParts[pathParts.length - 1]
    currentLevel[fileName] = {
      type: 'file',
      name: fileName,
      path: file.webkitRelativePath,
      file,
      size: file.size,
      lastModified: file.lastModified,
      isVideo: isVideoFile(fileName),
      isImage: isImageFile(fileName)
    }
  })
  
  // Convert to array format
  const convertToArray = (obj) => {
    return Object.values(obj).map(item => {
      if (item.type === 'folder') {
        return {
          ...item,
          children: convertToArray(item.children)
        }
      }
      return item
    }).sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      return a.type === 'folder' ? -1 : 1
    })
  }
  
  return convertToArray(fileTree)
}

// Fallback for browsers that support File System Access API
export async function scanDirectory(dirHandle, path = '') {
  const items = []
  
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      const fullPath = path ? `${path}/${name}` : name
      
      if (handle.kind === 'directory') {
        const subItems = await scanDirectory(handle, fullPath)
        items.push({
          type: 'folder',
          name,
          path: fullPath,
          children: subItems
        })
      } else if (handle.kind === 'file') {
        const file = await handle.getFile()
        items.push({
          type: 'file',
          name,
          path: fullPath,
          file,
          size: file.size,
          lastModified: file.lastModified,
          isVideo: isVideoFile(name),
          isImage: isImageFile(name)
        })
      }
    }
  } catch (error) {
    console.error('Error scanning directory:', error)
  }
  
  return items.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }
    return a.type === 'folder' ? -1 : 1
  })
}

// Check if File System Access API is supported
export function supportsFileSystemAccess() {
  return 'showDirectoryPicker' in window
}

export function isVideoFile(filename) {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v']
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

export function isImageFile(filename) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}