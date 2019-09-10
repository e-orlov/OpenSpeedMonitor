import {Component, Input, OnInit} from '@angular/core';
import {MeasurandGroup, SelectableMeasurand, Measurand} from "../../../../models/measurand.model";
import {BehaviorSubject, combineLatest, Observable, Subject} from "rxjs";
import {ResultSelectionStore} from "../../services/result-selection.store";
import {ResponseWithLoadingState} from "../../../../models/response-with-loading-state.model";
import {map, takeUntil, takeWhile} from 'rxjs/operators';
import {UiComponent} from "../../../../enums/ui-component.enum";
import {PerformanceAspectService} from "../../../../services/performance-aspect.service";
import {PerformanceAspectType} from "../../../../models/perfomance-aspect.model";
import {RemainingResultSelectionParameter} from "../../models/remaing-result-selection.model";

@Component({
  selector: 'osm-result-selection-measurands',
  templateUrl: './measurands.component.html',
  styleUrls: ['./measurands.component.scss']
})
export class MeasurandsComponent implements OnInit {
  aspectTypes$:BehaviorSubject<PerformanceAspectType[]> = new BehaviorSubject<PerformanceAspectType[]>([]);
  measurands$: BehaviorSubject<ResponseWithLoadingState<BehaviorSubject<MeasurandGroup>[]>> = new BehaviorSubject({
    isLoading: false,
    data: []
  });

  selectedMeasurands: (Measurand)[] = [];
  defaultValue$: BehaviorSubject<Measurand> = new BehaviorSubject(null);
  addingComparativeTimeFrameDisabled$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  @Input() multipleMeasurands = false;
  @Input() addingMeasurandsDisabled$: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private resultSelectionStore: ResultSelectionStore, private performanceAspectService: PerformanceAspectService) {
    this.aspectTypes$ = this.performanceAspectService.aspectTypes$;
    this.measurands$.next({
      ...this.measurands$.getValue(),
      data: [
        this.resultSelectionStore.loadTimes$,
        this.resultSelectionStore.userTimings$,
        this.resultSelectionStore.heroTimings$,
        this.resultSelectionStore.requestCounts$,
        this.resultSelectionStore.requestSizes$,
        this.resultSelectionStore.percentages$
      ]
    });
    this.getDefaultValue();
  }

  ngOnInit() {
    this.resultSelectionStore.registerComponent(UiComponent.MEASURAND);
    this.loadingState().subscribe(next => {
      this.measurands$.next({...this.measurands$.getValue(), isLoading: next});
    });
    if (this.resultSelectionStore.validQuery) {
      this.loadResultSelection();
    } else {
      this.defaultValue$
        .pipe(takeWhile((measurand: Measurand) => measurand === undefined, true))
        .subscribe((measurand: Measurand) => this.setDefaultValue(measurand));
    }
  }

  selectMeasurand(index: number, measurand: Measurand): void {
    this.selectedMeasurands[index] = measurand;
    this.setResultSelection();
  }

  addMeasurandField(): void {
    this.selectedMeasurands.push(this.defaultValue$.getValue());
    this.setResultSelection();
    this.addingComparativeTimeFrameDisabled$.next(true);
  }

  removeMeasurandField(index: number): void {
    this.selectedMeasurands.splice(index, 1);
    this.setResultSelection();
    if (this.selectedMeasurands.length == 1) {
      this.addingComparativeTimeFrameDisabled$.next(false);
    }
  }

  trackByFn(index: number, item: any): number {
    return index;
  }

  getDefaultValue(): void {
    this.aspectTypes$.subscribe((next: PerformanceAspectType[]) => {
      this.defaultValue$.next(next[0]);
    });
  }

  setDefaultValue(defaultValue: Measurand): void {
    if (defaultValue) {
      this.selectedMeasurands = [defaultValue];
      this.setResultSelection();
    }
  }

  private loadingState(): Observable<boolean> {
    return combineLatest(
      this.resultSelectionStore.loadTimes$,
      this.resultSelectionStore.userTimings$,
      this.resultSelectionStore.heroTimings$,
      this.resultSelectionStore.requestCounts$,
      this.resultSelectionStore.requestSizes$,
      this.resultSelectionStore.percentages$
    ).pipe(
        map(next => next.map(item => item.isLoading).some(value => value))
    )
  }

  private loadResultSelection(): void {
    let allMeasurands: SelectableMeasurand[];
    let performanceAspects: PerformanceAspectType[];
    const finishedLoading$: Subject<void> = new Subject<void>();

    this.loadingState().pipe(takeUntil(finishedLoading$)).subscribe(loading => {
      if (!loading) {
        performanceAspects = [...this.aspectTypes$.getValue()];
        allMeasurands = [
          ...this.resultSelectionStore.loadTimes$.getValue().values,
          ...this.resultSelectionStore.userTimings$.getValue().values,
          ...this.resultSelectionStore.heroTimings$.getValue().values,
          ...this.resultSelectionStore.requestCounts$.getValue().values,
          ...this.resultSelectionStore.requestSizes$.getValue().values,
          ...this.resultSelectionStore.percentages$.getValue().values
        ];

        const selectedPerformanceAspectTypes = (performanceAspects && this.resultSelectionStore.remainingResultSelection.performanceAspectTypes) ?
          [...performanceAspects.filter(aspect => this.resultSelectionStore.remainingResultSelection.performanceAspectTypes.includes(aspect.name))] : [];
        const selectedMeasurandsx = (allMeasurands && this.resultSelectionStore.remainingResultSelection.measurands) ?
          [...allMeasurands.filter(measurand => this.resultSelectionStore.remainingResultSelection.measurands.includes(measurand.id))] : [];


        this.selectedMeasurands = [
          ...selectedPerformanceAspectTypes,
          ...selectedMeasurandsx
        ];

        finishedLoading$.next();
      }
    });
  }

  private setResultSelection(): void {
    this.resultSelectionStore.setRemainingResultSelectionEnums(
      this.selectedMeasurands.filter((item: Measurand) => {
        if (item) {
          return item.kind === "performance-aspect-type"
        }
        return false
      }).map((performanceAspectType: PerformanceAspectType) => performanceAspectType.name),
      RemainingResultSelectionParameter.PERFORMANCE_ASPECT_TYPES
    );
    this.resultSelectionStore.setRemainingResultSelectionEnums(
      this.selectedMeasurands.filter((item: Measurand) => {
        if (item) {
          return item.kind === "selectable-measurand"
        }
        return false;
      }).map((measurand: SelectableMeasurand) => measurand.id),
      RemainingResultSelectionParameter.MEASURANDS
    );
  }
}
