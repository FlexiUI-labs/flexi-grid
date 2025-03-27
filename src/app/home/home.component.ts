import { Component, computed, inject, resource, signal } from '@angular/core';
import { FlexiGridModule } from '../../../library/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FlexiGridFilterDataModel } from '../../../library/src/lib/models/flexi-grid-filter-data.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [FlexiGridModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly result = resource({
    loader: async() => {
      const res = await lastValueFrom(this.#http.get<any>("/efatura.json"));
      await new Promise((res)=> setTimeout(res, 2000));
      return res;
    }
  });

  readonly data = computed(() => this.result.value().data ?? []);
  readonly loading = computed(() => this.result.isLoading());
  readonly faturaDurumFilterData = signal<FlexiGridFilterDataModel[]>([
    {
      name: "KABUL",
      value: "KABUL"
    },
    {
      name: "RED",
      value: "RED"
    },
  ]);
  readonly faturaTipiFilterData = signal<FlexiGridFilterDataModel[]>([
    {
      name: "OLMAYAN",
      value: "OLMAYAN"
    },
    {
      name: "BOS",
      value: "BOS"
    },
    {
      name: "IADE",
      value: "IADE"
    },
    {
      name: "IHRACKAYITLI",
      value: "IHRACKAYITLI"
    },
    {
      name: "ISTISNA",
      value: "ISTISNA"
    },
    {
      name: "KOMISYONCU",
      value: "KOMISYONCU"
    },
    {
      name: "OZELMATRAH",
      value: "OZELMATRAH"
    },
    {
      name: "SATIS",
      value: "SATIS"
    },
    {
      name: "TEVKIFAT",
      value: "TEVKIFAT"
    },
  ]);
  readonly faturaProfileFilterData = signal<FlexiGridFilterDataModel[]>([
    {
      name: "TICARIFATURA",
      value: "TICARIFATURA"
    },
    {
      name: "TEMELFATURA",
      value: "TEMELFATURA"
    },
  ]);

  readonly #http = inject(HttpClient);

  getFaturaTipClass(item:any){
    var type = item.invoiceType;
    switch (type) {
      case "BOS": return "flexi-grid-card-light"
      case "IADE": return "flexi-grid-card-danger"
      case "IHRACKAYITLI": return "flexi-grid-card-info"
      case "ISTISNA": return "flexi-grid-card-secondary"
      case "KOMISYONCU": return "flexi-grid-card-dark"
      case "OZELMATRAH": return "flexi-grid-card-warning"
      case "SATIS": return "flexi-grid-card-primary"
      case "TEVKIFAT": return "flexi-grid-card-info"
      default: return ""
    }
  }
}
