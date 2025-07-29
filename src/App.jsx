import React, { useState, useEffect, useRef } from 'react'
import { FolderOpen, AlertCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import VideoPlayer from '@/components/VideoPlayer'
import FileExplorer from '@/components/FileExplorer'
import { scanDirectory, processFileList, supportsFileSystemAccess } from '@/lib/utils'
import './styles.css'

function App() {
  const [files, setFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [completedFiles, setCompletedFiles] = useState([])
  const fileInputRef = useRef(null)

  // Load completed files from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('course-completed-files')
    if (saved) {
      try {
        setCompletedFiles(JSON.parse(saved))
      } catch (e) {
        console.error('Error loading completed files:', e)
      }
    }
  }, [])

  // Save completed files to localStorage
  useEffect(() => {
    localStorage.setItem('course-completed-files', JSON.stringify(completedFiles))
  }, [completedFiles])

  const handleFolderSelect = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (supportsFileSystemAccess()) {
        // Use File System Access API for modern browsers
        const dirHandle = await window.showDirectoryPicker()
        const scannedFiles = await scanDirectory(dirHandle)
        setFiles(scannedFiles)
      } else {
        // Fallback to file input for older browsers
        fileInputRef.current?.click()
        return
      }
      
      // Auto-select first video file
      const findFirstVideo = (items) => {
        for (const item of items) {
          if (item.type === 'file' && item.isVideo) {
            return item
          }
          if (item.type === 'folder' && item.children) {
            const found = findFirstVideo(item.children)
            if (found) return found
          }
        }
        return null
      }
      
      const firstVideo = findFirstVideo(files.length > 0 ? files : scannedFiles)
      if (firstVideo) {
        setSelectedFile(firstVideo)
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        setError('Failed to access directory. Please try using the file upload method instead.')
        console.error('Directory access error:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileInputChange = (event) => {
    const fileList = event.target.files
    if (fileList && fileList.length > 0) {
      setLoading(true)
      setError(null)
      
      try {
        const processedFiles = processFileList(fileList)
        setFiles(processedFiles)
        
        // Auto-select first video file
        const findFirstVideo = (items) => {
          for (const item of items) {
            if (item.type === 'file' && item.isVideo) {
              return item
            }
            if (item.type === 'folder' && item.children) {
              const found = findFirstVideo(item.children)
              if (found) return found
            }
          }
          return null
        }
        
        const firstVideo = findFirstVideo(processedFiles)
        if (firstVideo) {
          setSelectedFile(firstVideo)
        }
        
      } catch (error) {
        setError('Failed to process files. Please try again.')
        console.error('File processing error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleFileSelect = (file) => {
    setSelectedFile(file)
    // Set a small timeout to ensure the video element is properly updated
    setTimeout(() => {
      const videoElement = document.querySelector('video')
      if (videoElement) {
        videoElement.play()
          .catch(err => {
            console.warn('Autoplay failed:', err)
            // Some browsers require user interaction before autoplay
          })
      }
    }, 100)
  }

  const handleMarkComplete = (filePath) => {
    setCompletedFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(path => path !== filePath)
      } else {
        return [...prev, filePath]
      }
    })
  }

  const getTotalFiles = (items) => {
    let count = 0
    for (const item of items) {
      if (item.type === 'file' && item.isVideo) {
        count++
      } else if (item.type === 'folder' && item.children) {
        count += getTotalFiles(item.children)
      }
    }
    return count
  }

  const totalVideos = getTotalFiles(files)
  const completedVideos = completedFiles.length
  const progressPercentage = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="container mx-auto p-4 h-screen flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Course Player</h1>
              {totalVideos > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    Progress: {completedVideos} / {totalVideos} videos completed
                  </div>
                  <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-lime-400 transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-lime-400 font-medium">
                    {Math.round(progressPercentage)}%
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {supportsFileSystemAccess() ? (
                <Button 
                  onClick={handleFolderSelect}
                  disabled={loading}
                  className="bg-lime-600 hover:bg-lime-700"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {files.length > 0 ? 'Change Folder' : 'Select Course Folder'}
                </Button>
              ) : (
                <div className="text-right">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-lime-600 hover:bg-lime-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {files.length > 0 ? 'Upload New Course' : 'Upload Course Files'}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">
                    Select the entire course folder
                  </p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                webkitdirectory="true"
                directory="true"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
                accept="video/*,image/*"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-4 p-4 bg-red-900/20 border-red-500/20">
            <div className="flex items-center text-red-400">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </Card>
        )}

        {/* Main Content */}
        {files.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 bg-gray-900/50 border-gray-700 max-w-md">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Course Loaded</h2>
                <p className="text-gray-400 mb-6 text-sm">
                  {supportsFileSystemAccess() 
                    ? "Select a folder containing your course content to get started."
                    : "Upload your course folder to get started. All files will be processed locally in your browser."
                  }
                </p>
                
                {supportsFileSystemAccess() ? (
                  <Button 
                    onClick={handleFolderSelect}
                    disabled={loading}
                    className="bg-lime-600 hover:bg-lime-700 w-full"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Select Course Folder'}
                  </Button>
                ) : (
                  <div>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="bg-lime-600 hover:bg-lime-700 w-full mb-2"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {loading ? 'Processing...' : 'Upload Course Files'}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Select the entire course folder when prompted
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
            {/* File Explorer Sidebar */}
            <div className="lg:col-span-1" style={{ height: '100%', overflow: 'hidden' }}>
              <Card className="h-full bg-gray-900/30 border-gray-700" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold text-lg">Course Content</h3>
                  {totalVideos > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      {totalVideos} videos found
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 70px)' }}>
                  <FileExplorer
                    files={files}
                    onFileSelect={handleFileSelect}
                    selectedFile={selectedFile}
                    completedFiles={completedFiles}
                    onMarkComplete={handleMarkComplete}
                  />
                </div>
              </Card>
            </div>

            {/* Video Player */}
            <div className="lg:col-span-3" style={{ height: '100%', overflow: 'hidden', minHeight: '400px' }}>
              <Card className="h-full bg-gray-900/30 border-gray-700">
                <div className="p-6 h-full" style={{ height: 'calc(100% - 48px)' }}>
                  {selectedFile ? (
                    <VideoPlayer
                      videoFile={selectedFile.file}
                      title={selectedFile.name}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                          <FolderOpen className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Select a video to play</h3>
                        <p className="text-gray-400">
                          Choose a video file from the course content sidebar to start watching.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App