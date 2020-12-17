import { prepareSyntheticListenerFunctionName } from '@angular/compiler/src/render3/util';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  Query
} from "@angular/core";

import { loadModules } from "esri-loader";
import esri = __esri; // Esri TypeScript Types
import { Guid } from 'typescript-guid';
import { CsvRec } from '../../models/CsvRec';
import { IOptions } from '../../interfaces/IOptions';
import { all } from 'esri/smartMapping/symbology/support/colorRamps';

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})


export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;
  @ViewChild("timeSliderDiv", { static: true }) private timeSliderDivEl: ElementRef;

  private _map: esri.Map;
  private _zoom = 1;
  private _center: Array<number> = [0.0, 0.0];
  private _basemap = "streets";
  private _loaded = false;
  private _view: esri.MapView = null;
  private _featLayer: esri.FeatureLayer = null;
  private _featLayerView: any; //esri.FeatureLayerView;
  public featuresOnMap: number = 0;

  get mapLoaded(): boolean { return this._loaded; }

  @Input()
  set zoom(zoom: number) { this._zoom = zoom; }
  get zoom(): number { return this._zoom; }

  @Input()
  set center(center: Array<number>) { this._center = center; }
  get center(): Array<number> { return this._center; }

  @Input()
  set basemap(basemap: string) { this._basemap = basemap; }
  get basemap(): string { return this._basemap; }

  constructor() {}

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, FeatureLayer, KmlLayer, CSVLayer, FeatureFilter, TimeSlider, FeatureSet, Query] = await loadModules([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/KMLLayer",
        "esri/layers/CSVLayer",
        "esri/views/layers/support/FeatureFilter",
        "esri/widgets/TimeSlider",
        "esri/tasks/support/FeatureSet",
        "esri/tasks/support/Query"
      ]);

      this._map = new EsriMap({ basemap: this._basemap } as esri.MapProperties);

      fetch('./resources/111.txt')
      .then(results => results.text())
      .then(data => data.split('\r\n'))
      .then(data => data
        .map(d => {
          const myMatches = d.match(/(\w*)\D*(\d+)\D*(\d+\.\d+)\D*(\d+\.\d+)/);
          if(!myMatches || myMatches.length != 5) { return null; }

          return {
            pointName: myMatches[1],
            timestamp: parseInt(myMatches[2]),
            latitude: myMatches[3],
            longitude: myMatches[4]
          } as CsvRec
        })
        .filter(f => f && f.timestamp)
      )
      .then(data => data.map(d => {
        // Create geometry for the items in our list
        return {
          geometry: { type: "point", x: d.latitude, y: d.longitude },
          symbol: { type: "simple-marker", color: [226, 119, 40] },
          attributes: {
            ObjectID: Guid.create().toString(),
            title: d.timestamp.toString(),
            pointName: d.pointName,
            latitude: String(d.latitude),
            longitude: String(d.longitude),
            timestamp: d.timestamp * 1000
          }
        }
      }))
      .then(data => data.sort((a, b) => a.attributes.timestamp - b.attributes.timestamp))
      .then(data => {
        console.log('Objects to map: ', data);

        this._featLayer = new FeatureLayer({
          title: 'Flight Layer',
          refreshInterval: 5,
          source: data,
          fields: [
            { name: "ObjectID", alias: "ObjectID", type: "oid" },
            { name: "title", alias: "title", type: "string" },
            { name: "pointName", alias: "pointName", type: "string" },
            { name: "latitude", alias: "Latitude", type: "string" },
            { name: "longitude", alias: "Longitude", type: "string" },
            { name: "timestamp", alias: "timestamp", type: "date" }
          ],
          renderer: {
            type: "simple",  // autocasts as new SimpleRenderer()
            symbol: {
              type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
              size: 8,
              color: "black",
              outline: {  // autocasts as new SimpleLineSymbol()
                width: 0.5,
                color: "white"
              }
            }
          },
          popupTemplate: {
            title: "{pointName} {timestamp}",
            content: [{
              type: "fields",
              fieldInfos: [
                { fieldName: "pointName", label: "pointName", visible: true },
                { fieldName: "Latitude", label: "Latitude", visible: true },
                { fieldName: "Latitude", label: "Latitude", visible: true },
                { fieldName: "Longitude", label: "Longitude", visible: true },
                { fieldName: "timestamp", label: "timestamp", visible: true }
              ]
            }],
            fieldInfos: [
              { fieldName: "time", format: { dateFormat: "short-date-short-time" } }
            ]
          },
          timeExtent: {
            start: new Date(data[0].attributes.timestamp),
            end: new Date(data[data.length - 1].attributes.timestamp)
          },
          useViewTime: true,
          timeInfo: {
            startField: "timestamp"
          }
        });
        this._map.add(this._featLayer);

        console.log('Feat Layer: ', this._featLayer);
      });


      // Initialize the MapView
      this._view = new EsriMapView({
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: this._map
      });

      await this._view.when();
      // Build the time slider
      new TimeSlider({
        container: this.timeSliderDivEl.nativeElement,
        view: this._view,
        mode: "time-window",
        loop: true,
        playRate: 300,
        fullTimeExtent: this._featLayer.timeExtent,
        stops: {
          interval: {
            value: 30,
            unit: "seconds"
          }
        }
      });

      return this._view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  calculateNeighbors(options: IOptions): void {
    // Experimental client-side stuff
    this._featLayerView.queryFeatures()
    .then((results: esri.FeatureSet) => {
      console.log('All Displayed Features Query Results: ', results);

      return results.features.map(d => {
        // Create a query for every displayed feature on the map
        const query: esri.Query = this._featLayerView.layer.createQuery();
        query.geometry = d.geometry;
        query.distance = 30;
        query.units = "feet";
        return query;
      })
    })
    .then((queryObjs: Array<esri.Query>) => {
      // Now create a PromiseAll based on the array of queries we just built
      //  and once they have all resolved, do some spiffy filterting... not
      //  sure this really works right now
      Promise.all(queryObjs.map(m => this._featLayerView.queryFeatures(m)))
        .then((allResults: Array<esri.FeatureSet>) => allResults.map(m => m.features))
        .then((allFeats: Array<Array<esri.Graphic>>) => allFeats.filter(f => f.length > 1))
        .then((filtered: Array<Array<esri.Graphic>>) => filtered.map(m => m.filter(f => f.visible)))
        .then(filtered => {
          console.log('All Queries Filtered Results: ', filtered)
        })
    });
  }

  ngOnInit() {
    this.initializeMap().then(mapView => {
      mapView.whenLayerView(this._featLayer)
      .then(layerView => {
        this._featLayerView = layerView;
        //layerView.watch("updating", (val) => {
        //  console.log(this._view);
        //});
      });

      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }
}
