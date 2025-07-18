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
  readonly data = computed(() => Orders);
}


export const Orders = [
  { "date": "2025-07-01", "productName": "Wireless Mouse", "quantity": 2, "price": 19.99, "total": 39.98 },
  { "date": "2025-07-02", "productName": "Mechanical Keyboard", "quantity": 1, "price": 89.50, "total": 89.50 },
  { "date": "2025-07-03", "productName": "USB-C Hub", "quantity": 3, "price": 15.75, "total": 47.25 },
  { "date": "2025-07-03", "productName": "Laptop Stand", "quantity": 1, "price": 32.90, "total": 32.90 },
  { "date": "2025-07-04", "productName": "Webcam", "quantity": 2, "price": 45.00, "total": 90.00 },
  { "date": "2025-07-05", "productName": "Bluetooth Speaker", "quantity": 1, "price": 59.99, "total": 59.99 },
  { "date": "2025-07-06", "productName": "Desk Lamp", "quantity": 2, "price": 22.50, "total": 45.00 },
  { "date": "2025-07-06", "productName": "External SSD", "quantity": 1, "price": 109.99, "total": 109.99 },
  { "date": "2025-07-07", "productName": "HDMI Cable", "quantity": 5, "price": 8.25, "total": 41.25 },
  { "date": "2025-07-08", "productName": "Smartphone Holder", "quantity": 3, "price": 12.90, "total": 38.70 },
  { "date": "2025-07-09", "productName": "Gaming Headset", "quantity": 1, "price": 75.00, "total": 75.00 },
  { "date": "2025-07-09", "productName": "Power Bank", "quantity": 2, "price": 29.95, "total": 59.90 },
  { "date": "2025-07-10", "productName": "Wireless Charger", "quantity": 1, "price": 24.99, "total": 24.99 },
  { "date": "2025-07-10", "productName": "Ergonomic Chair", "quantity": 1, "price": 199.90, "total": 199.90 },
  { "date": "2025-07-11", "productName": "Monitor 27\"", "quantity": 2, "price": 149.99, "total": 299.98 },
  { "date": "2025-07-12", "productName": "Desk Mat", "quantity": 3, "price": 10.00, "total": 30.00 },
  { "date": "2025-07-13", "productName": "Smart LED Bulb", "quantity": 4, "price": 9.99, "total": 39.96 },
  { "date": "2025-07-14", "productName": "Streaming Microphone", "quantity": 1, "price": 139.00, "total": 139.00 },
  { "date": "2025-07-15", "productName": "Graphic Tablet", "quantity": 1, "price": 85.50, "total": 85.50 },
  { "date": "2025-07-16", "productName": "Portable Projector", "quantity": 1, "price": 249.99, "total": 249.99 }
]
