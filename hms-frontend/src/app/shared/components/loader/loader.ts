import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loader.html',
  styleUrl: './loader.css'
})
export class Loader { }