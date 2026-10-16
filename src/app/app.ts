import { Component } from '@angular/core';
import { DocumentUpload } from './document-upload/document-upload';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DocumentUpload],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'document-intelligence-ui';
}