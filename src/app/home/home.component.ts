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
  readonly state = signal<StateModel>(new StateModel());
  readonly result = resource({
    request: this.state,
    loader: async() => {
      const token = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImMxZWYyYzA1LTliNmMtNDAxYi1iNzVmLTRkMTkzNzEwYmFkMyIsImZ1bGxOYW1lIjoiU3lzdGVtIEFkbWluIiwiZW1haWwiOiJhZG1pbkBhZG1pbi5jb20iLCJuYmYiOjE3NDUyNzY2NTMsImV4cCI6MTc0NTM2MzA1MywiaXNzIjoiUHVibGljIFdhc3RlIE1hbmFnZW1lbnQgU3lzdGVtIiwiYXVkIjoiUHVibGljIFdhc3RlIE1hbmFnZW1lbnQgU3lzdGVtIn0.sbpZcwtrmeQQImGbJzl6ZyaCU260EnDSA5LUfcsaXuZWQyXXOo0kmc1l7oilcg92VgQ4bH5ZVzJbTm4Hl2c0PQ"
      let endpoint = "https://pwms.webapi.ecnorow.com/odata/zones?$count=true&&top=45";
      // const odataEndpoint = this.#grid.getODataEndpoint(this.state());
      // endpoint += odataEndpoint;
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

  readonly #http = inject(HttpClient);
  readonly #grid = inject(FlexiGridService);

  changeOData(state:StateModel) {
   //this.state.set(state);
  }
}