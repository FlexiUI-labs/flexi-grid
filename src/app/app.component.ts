import { Component, computed, inject, resource, signal } from '@angular/core';
import { FlexiGridModule } from '../../library/src/lib/modules/flexi-grid.module';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [FlexiGridModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(){
    debugger
  }
  readonly result = resource({
    loader: async() => {
      const res = await lastValueFrom(this.#http.get<any[]>("https://jsonplaceholder.typicode.com/users"));
      return res;
    }
  });

  readonly data = computed(() => this.result.value() ?? []);
  readonly loading = computed(() => this.result.isLoading());

  readonly #http = inject(HttpClient);
}
