import { Component, computed, inject, resource, signal } from '@angular/core';
import { FlexiGridModule } from '../../../library/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FlexiGridService } from '../../../library/src/lib/services/flexi-grid.service';
import { StateModel } from '../../../library/src/lib/models/state.model';


@Component({
  selector: 'app-home',
  imports: [FlexiGridModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly state = signal<StateModel>({
    filter: [{field:'status', value:'Bekliyor',operator:'eq', type:'select'}],
    sort: {field:'pickUpDateTime', dir:'asc'},
    pageNumber: 1,
    pageSize: 10,
    skip: 0
  });
  readonly result = resource({
    params: () => this.state(),
    loader: async() => {
      console.log(this.state());
      
      const token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjAxOTdkZDlmLTIxMDktNzJjNS04MzczLTAyNjQzZjBkNjRhOCIsImZ1bGxOYW1lIjoiVGFuZXIgU2F5ZGFtIiwiZnVsbE5hbWVXaXRoRW1haWwiOiJUYW5lciBTYXlkYW0gKHRhbmVyc2F5ZGFtQGdtYWlsLmNvbSkiLCJlbWFpbCI6InRhbmVyc2F5ZGFtQGdtYWlsLmNvbSIsInJvbGUiOiJzeXNfYWRtaW4iLCJwZXJtaXNzaW9ucyI6IltdIiwiYnJhbmNoIjoiTWVya2V6IMWedWJlIiwiYnJhbmNoSWQiOiIwMTk3ZGQ5Zi0yMGI2LTdiOWEtYTYxOS0zZGYyNTQ5NDA4MGUiLCJuYmYiOjE3NTIwNTU5MTgsImV4cCI6MTc1MjE0MjMxOCwiaXNzIjoiUmVudCBBIENhciIsImF1ZCI6IkN1c3RvbWVycyJ9.BvhjdSGjZpVZSuxQ8fEOq5FlIRlc5hym2eg8aonFRNq1Ll3hLxcuIvR6dm1qJTXezHlVzsnp_KyQZJsUZuo7SA"
      let endpoint = "https://localhost:7207/odata/reservations?$expand=vehicle&$count=true&";
      const odataEndpoint = this.#grid.getODataEndpoint(this.state());
      endpoint += odataEndpoint;
      const res = await lastValueFrom<any>(this.#http.get<any>(endpoint, {
        headers: {
          "Authorization": `Bearer ${token}`,
        }
      }));

     await new Promise((resolve) => setTimeout(resolve, 2000));
      return res;
    }
  });

  readonly data = computed(() => this.result.value()?.value ?? []);
  readonly total = computed(() => this.result.value()?.["@odata.count"] ?? 0);
  readonly loading = computed(() => this.result.isLoading());
  readonly orderNumbersData = signal<number[]>([1,2,3,4,5,6]);
  readonly statusFilterData = signal<string[]>([
    "Bekliyor",
    "Teslim Edildi",
    "Tamamlandı",
    "İptal Edildi"
  ])

  readonly #http = inject(HttpClient);
  readonly #grid = inject(FlexiGridService);

  changeOData(state:StateModel) {
   this.state.set(state);
  }

  onReorder(event:any){
    console.log(event);
    
  }

    getStatusClass(status:string){
    switch (status) {
      case "Bekliyor": return "flexi-grid-card-warning"
      case "Teslim Edildi": return "flexi-grid-card-info"
      case "Tamamlandı": return "flexi-grid-card-success"
      case "İptal Edildi": return "flexi-grid-card-danger"
      default: return "";
    }
  }
}