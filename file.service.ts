import { Injectable, signal } from '@angular/core';
import { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, WriteFileResult, Encoding } from '@capacitor/filesystem';

@Injectable({
    providedIn: 'root',
})
export class FileService {

    documentsUri = signal<string>("");

    getAbsolutePath(uri: string, path: string): string {
        return `${uri}${path}`;
    }

    getExtension(source: File | string): string {
        let index = source instanceof File ? source.type.indexOf("/") : source.lastIndexOf(".");

        return `.${ source instanceof File ? source.type.substring(index + 1) : source.substring(index + 1)}`
    }

    getSrcWeb(uri: string){
        return Capacitor.convertFileSrc(uri);
    }

    async getDocumentsUri(path: string): Promise<string>{
        let directory = Directory.Documents,
            uri = await Filesystem.getUri({path, directory});

        this.documentsUri.set(uri.uri);

        return uri.uri;
    }

    getFileName(source: File | Photo){
        let extension = "";

        if(source instanceof File){
            extension = this.getExtension(source);
        }
        else{
            extension = `.${source.format}`;
        }

        return `${Date.now()}${extension}`
    } 

    async saveFile(file: File, fileName: string, subDir?: string, directory: Directory = Directory.Documents): Promise<WriteFileResult> {
        const base64 = await this.fileToBase64(file);

        return this.writeFile(base64, fileName, subDir, directory);
    }

    async writeFile(data: string, fileName: string, subDir?: string, directory: Directory = Directory.Documents, encoding?: Encoding): Promise<WriteFileResult> {
        const path = subDir ? `${subDir}/${fileName}` : fileName;

        if (subDir) {
            await this.createDir(subDir, directory);
        }

        return await Filesystem.writeFile({
            path,
            data,
            directory,
            encoding,
        });
    }

    async readFile(path: string, directory: Directory = Directory.Documents) {
        return Filesystem.readFile({
            path,
            directory: directory,
        });
    }

    async deleteFile(fileName: string, subDir?: string, directory: Directory = Directory.Documents) {
         const path = subDir ? `${subDir}/${fileName}` : fileName;

        return Filesystem.deleteFile({
            path,
            directory: directory,
        });
    }

    async listFiles(path: string, directory: Directory = Directory.Documents) {
        return Filesystem.readdir({
            path,
            directory: directory,
        });
    } 

    async createDir(path: string, directory: Directory = Directory.Documents) {
        try {
            await Filesystem.mkdir({
                path,
                directory,
                recursive: true,
            });
        } catch (e) {
            // Le dossier existe déjà
        }
    }

    async deleteDir(path: string, directory: Directory = Directory.Documents) {
        try {
            await Filesystem.rmdir({
                path,
                directory,
                recursive: true,
            });
        } catch (e) {
            // Le dossier existe déjà
        }
    }

    fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async requestFilePermissions(): Promise<boolean> {
        let status = await Filesystem.checkPermissions();
        if (status.publicStorage !== 'granted') {
            status = await Filesystem.requestPermissions();
        }
        return status.publicStorage === 'granted';
    }
}
