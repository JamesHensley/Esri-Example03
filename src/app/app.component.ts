import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'esri';
  
  // Set our map properties
  mapCenter = [9.178023437625741, 48.77463735204129];
  basemapType = 'streets';
  mapZoomLevel = 15;

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }
}
