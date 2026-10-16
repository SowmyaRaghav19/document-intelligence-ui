import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';

interface DocumentResult {
  filename: string;
  status: 'success' | 'rejected' | 'uploading' | 'error';
  chunkCount?: number;
  categories?: Record<string, number>;
  errorMessage?: string;
}

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.html',
  styleUrl: './document-upload.css'
})
export class DocumentUpload {
  results = signal<DocumentResult[]>([]);
  isUploading = signal(false);

  constructor(private http: HttpClient) {}

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.uploadFiles(files);
  }

  uploadFiles(files: File[]) {
    this.isUploading.set(true);

    const initialResults: DocumentResult[] = files.map(f => ({
      filename: f.name,
      status: 'uploading'
    }));
    this.results.set(initialResults);

    let completedCount = 0;
    const totalFiles = files.length;

    const checkAllDone = () => {
      completedCount++;
      if (completedCount === totalFiles) {
        this.isUploading.set(false);
      }
    };

    files.forEach((file, index) => {
      const formData = new FormData();
      formData.append('file', file);

      this.http.post<any>(`${environment.apiUrl}/extract`, formData).subscribe({
        next: (response) => {
          this.updateResult(index, {
            filename: file.name,
            status: 'success',
            chunkCount: response.chunk_count
          });
          checkAllDone();
        },
        error: (err) => {
          if (err.status === 422) {
            this.updateResult(index, {
              filename: file.name,
              status: 'rejected',
              categories: err.error?.detail?.categories
            });
          } else {
            this.updateResult(index, {
              filename: file.name,
              status: 'error',
              errorMessage: err.error?.detail || 'Upload failed'
            });
          }
          checkAllDone();
        }
      });
    });
  }

  private updateResult(index: number, updated: DocumentResult) {
    this.results.update(current => {
      const copy = [...current];
      copy[index] = updated;
      return copy;
    });
  }

  objectEntries(obj: Record<string, number>): [string, number][] {
    return Object.entries(obj);
  }
}