// archiveHandler.js
import { Archive } from 'libarchive.js';

export class ArchiveHandlerImpl {
    constructor(workerUrl = '/worker-bundle.js') {
      this.initialized = false;
      this.workerUrl = workerUrl;
      this.debug = false;
      this.activeArchives = new Set(); // 跟踪打开的归档
    }

    log(...args) {
      if (this.debug) {
        console.log('[ArchiveHandler]', ...args);
      }
    }
  
    async ensureInit() {
      if (!this.initialized) {
        this.log('Initializing with worker URL:', this.workerUrl);
        await Archive.init({
          workerUrl: this.workerUrl
        });
        this.initialized = true;
        this.log('Initialization complete');
      }
    }

    /**
     * 检查是否是系统生成的特殊文件/文件夹
     */
    isSystemFile(path) {
      const systemPatterns = [
        '__MACOSX',          // Mac OS X 系统文件
        '.DS_Store',         // Mac OS X 桌面服务存储
        'desktop.ini',       // Windows 桌面设置
        'Thumbs.db',         // Windows 缩略图缓存
        '.AppleDouble',      // Mac OS X 资源分支
        '.spotlight-V100',   // Mac OS X Spotlight索引
        '.Trashes',          // Mac OS X 废纸篓
        '.fseventsd',        // Mac OS X 文件系统事件
        '.TemporaryItems',   // Mac OS X 临时项目
        '~$',                // Microsoft Office 临时文件前缀
        '.git',              // Git版本控制
        '.svn',              // SVN版本控制
        '.hg',               // Mercurial版本控制
        '.idea',             // IntelliJ IDEA项目文件
        '.vscode',           // Visual Studio Code项目文件
        '.project',          // Eclipse项目文件
        'node_modules',      // Node.js模块目录
        '__pycache__',       // Python缓存目录
        '.pytest_cache',     // Python测试缓存
        '.vs',               // Visual Studio项目文件
      ];
  
      return systemPatterns.some(pattern => {
        if (pattern.startsWith('.') || pattern.startsWith('_')) {
          // 对于以.或_开头的模式，检查路径的任何部分是否匹配
          return path.split('/').some(part => part === pattern);
        } else {
          // 对于其他模式，检查路径是否包含该模式
          return path.includes(pattern);
        }
      });
    }
  
    /**
     * 检查文件是否是压缩文件
     */
    isArchiveFile(filename) {
      const archiveExtensions = [
        '.zip', '.rar', '.7z', '.tar',
        '.tar.gz', '.tgz'
      ];
      const isArchive = archiveExtensions.some(ext => 
        filename.toLowerCase().endsWith(ext)
      );
      this.log('Checking if file is archive:', { filename, isArchive });
      return isArchive;
    }
  
    /**
     * 关闭并清理归档资源
     */
    async closeArchive(archive) {
      try {
        if (archive && typeof archive.close === 'function') {
          await archive.close();
        }
        this.activeArchives.delete(archive);
      } catch (error) {
        this.log('Error closing archive:', error);
      }
    }
  
    /**
     * 递归获取压缩文件中的所有文件路径
     */
    async getFileList(file, prefix = '') {
      await this.ensureInit();
      const result = [];
      let archive = null;
    
      try {
        const currentPrefix = prefix || file.name;
        
        this.log(`Opening archive${currentPrefix ? ` (${currentPrefix})` : ''}: ${file.name}`);
        archive = await Archive.open(file);
        this.activeArchives.add(archive);
        
        const files = await archive.getFilesArray();
        this.log('Files in archive:', files);
    
        for (const entry of files) {
          const entryPath = entry.path 
            ? (entry.path + '/' + entry.file.name).replace(/\/+/g, '/')
            : entry.file.name;
  
            // 跳过系统文件和特殊文件夹
          if (this.isSystemFile(entryPath)) {
            this.log('Skipping system file:', entryPath);
            continue;
          }
          
          const fullPath = `${currentPrefix}!${entryPath}`;
          this.log('Processing entry:', { entryPath, fullPath });
    
          if (this.isArchiveFile(entry.file.name)) {
            this.log('Found compressed file:', entry.file.name);
            
            try {
              this.log('Processing nested archive');
              const extractedFile = await entry.file.extract();
              const nestedFile = new File([extractedFile], entry.file.name);
              const nestedFiles = await this.getFileList(nestedFile, fullPath);
              result.push(...nestedFiles);
              
              // 清理提取的文件数据
              if (extractedFile instanceof Blob) {
                URL.revokeObjectURL(URL.createObjectURL(extractedFile));
    }
            } catch (nestedError) {
              this.log('Error processing compressed file:', nestedError);
            }
          } else {
            result.push(fullPath);
          }
        }
    
        return result;
      } catch (error) {
        this.log('Error in getFileList:', error);
        throw new Error(`获取文件列表失败: ${error.message}`);
      } finally {
        if (archive) {
          await this.closeArchive(archive);
        }
      }
    }
  
    /**
     * 提取指定路径的文件内容
     */
    async extractFile(file, path) {
      await this.ensureInit();
      this.log('Extracting file:', { originalFile: file.name, targetPath: path });
  
      if (!path.startsWith(file.name + '!')) {
        throw new Error(`路径必须以文件名 "${file.name}!" 开头`);
      }
  
      path = path.substring(file.name.length + 1);
      
    // 检查是否是系统文件
      if (this.isSystemFile(path)) {
        throw new Error(`不支持提取系统文件: ${path}`);
      }
  
      const pathParts = path.split('!');
      this.log('Path parts:', pathParts);
      
      let currentFile = file;
      let currentArchive = null;
      const archivesToClose = new Set();
  
      try {
        if (pathParts.length === 1) {
          currentArchive = await Archive.open(currentFile);
          archivesToClose.add(currentArchive);
          
          const files = await currentArchive.getFilesArray();
          const targetEntry = files.find(entry => {
            const entryPath = entry.path 
              ? (entry.path + '/' + entry.file.name).replace(/\/+/g, '/')
              : entry.file.name;
            return entryPath === pathParts[0];
          });
  
          if (!targetEntry) {
            throw new Error(`文件未找到: ${pathParts[0]}`);
          }
  
          const extracted = await targetEntry.file.extract();
          return await extracted.arrayBuffer();
        }
  
        for (let i = 0; i < pathParts.length - 1; i++) {
          currentArchive = await Archive.open(currentFile);
          archivesToClose.add(currentArchive);
          
          const files = await currentArchive.getFilesArray();
          const targetPath = pathParts[i];
          
          const targetEntry = files.find(entry => {
            const entryPath = entry.path 
              ? (entry.path + '/' + entry.file.name).replace(/\/+/g, '/')
              : entry.file.name;
            return entryPath === targetPath;
          });
  
          if (!targetEntry) {
            throw new Error(`文件未找到: ${targetPath}`);
          }
  
          const extracted = await targetEntry.file.extract();
          
          // 关闭当前归档before创建新的File对象
          await this.closeArchive(currentArchive);
          archivesToClose.delete(currentArchive);
          
          currentFile = new File([extracted], targetEntry.file.name);
          
          // 清理提取的文件数据
          if (extracted instanceof Blob) {
            URL.revokeObjectURL(URL.createObjectURL(extracted));
          }
        }
  
        currentArchive = await Archive.open(currentFile);
        archivesToClose.add(currentArchive);
        
        const finalFiles = await currentArchive.getFilesArray();
        const finalTargetPath = pathParts[pathParts.length - 1];
  
        const finalEntry = finalFiles.find(entry => {
          const entryPath = entry.path 
            ? (entry.path + '/' + entry.file.name).replace(/\/+/g, '/')
            : entry.file.name;
          return entryPath === finalTargetPath;
        });
  
        if (!finalEntry) {
          throw new Error(`最终文件未找到: ${finalTargetPath}`);
        }
  
        const finalExtracted = await finalEntry.file.extract();
        return await finalExtracted.arrayBuffer();
  
      } catch (error) {
        this.log('Error in extractFile:', error);
        throw new Error(`提取文件失败: ${error.message}`);
      } finally {
        // 确保所有打开的归档都被关闭
        for (const archive of archivesToClose) {
          await this.closeArchive(archive);
        }
      }
    }
  
    /**
     * 清理所有资源
     */
    async dispose() {
        for (const archive of this.activeArchives) {
          await this.closeArchive(archive);
        }
        this.activeArchives.clear();
        this.initialized = false;
    }
}

export function createArchiveHandler(workerScriptPath) {
    return new ArchiveHandlerImpl(workerScriptPath);
}