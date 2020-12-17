import {
    Component,
    OnInit,
    ViewChild,
    ElementRef,
    Input,
    Output,
    EventEmitter,
    OnDestroy
  } from "@angular/core";
import { IOptions } from 'src/app/interfaces/IOptions';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})

export class OptionsComponent implements OnInit, OnDestroy {
  @ViewChild("optionsNode", { static: true }) private optionsNodeEl: ElementRef;
  
  @Output()
  calculateNeighbors:EventEmitter<IOptions> = new EventEmitter<IOptions>();
  
  btnClickCalcNeighbors(): void {
    this.calculateNeighbors.emit({} as IOptions);
  }

  ngOnInit() {

  }

  ngOnDestroy() {

  }
}