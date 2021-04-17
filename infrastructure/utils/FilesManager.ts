import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime';

/**
 * Represents a file that will be used as an S3 bucket object.
 */
export interface IFile {
  contentType: string | null;
  filePath: string;
  key: string;
  fileName: string;
}

export interface IFilesManager {
  getFiles(): Array<IFile>;
}

export class FilesManager implements IFilesManager {
  private buildPath: string;

  constructor(buildPath: string) {
    this.buildPath = path.join(buildPath);
  }

  public getFiles = (): Array<IFile> => this.processFolder(this.buildPath);

  /**
   * The function takes all the files within a directory.
   * @param src The directory where get the files
   * @returns An array of IFile which are the files within a directory (including sub-directories)
   */
  private processFolder = (src: string): IFile[] => {
    return fs.readdirSync(src).reduce((accumulator: IFile[], item: string): IFile[] => {
      const relativePath = path.join(src, item);
      const stats = fs.lstatSync(relativePath);

      if (stats.isDirectory()) {
        accumulator.push(...this.processFolder(`${src}/${item}`));
      } else {
        accumulator.push(this.processFile(relativePath));
      }

      return accumulator;
    }, []);
  };

  /**
   * Builds the IFile element
   * @param relativePath 
   * @returns A IFile element to be used as an S3 bucket object
   */
  private processFile = (relativePath: string): IFile => {
    const buildFile: IFile  = {
      contentType: mime.getType(relativePath),
      fileName: relativePath.replace(/\.\.\\/g, '').replace(/\\/g, '-'),
      key: relativePath.replace(`${this.buildPath}/`, '').replace(/\\/g, '/'),
      filePath: relativePath,
    };

    return buildFile;
  };
}
