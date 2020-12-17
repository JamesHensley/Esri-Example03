import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { EsriMapComponent } from "./components/esri-map/esri-map.component";
import { OptionsComponent } from './components/optionsComponent/options.component';

@NgModule({
  declarations: [
    AppComponent, EsriMapComponent, OptionsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
