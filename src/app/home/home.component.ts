import { Component, computed, inject, resource } from '@angular/core';
import { FlexiGridModule } from '../../../library/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [FlexiGridModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  readonly result = resource({
    loader: async() => {
      const res = await lastValueFrom(this.#http.get<any[]>("/test.json"));
      await new Promise((res)=> setTimeout(res, 2000));
      return res;
    }
  });

  readonly data = computed(() => this.result.value() ?? []);
  readonly loading = computed(() => this.result.isLoading());

  readonly #http = inject(HttpClient);
}
