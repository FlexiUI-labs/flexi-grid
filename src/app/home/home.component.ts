import { Component, computed } from '@angular/core';
import { FlexiGridModule } from '../../../library/src/lib/modules/flexi-grid.module';
import { CommonModule } from '@angular/common';


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
  { "date": "2025-07-01", "productName": "Wireless Mouse", "quantity": 2, "price": 19.99, "total": 39.98, "product": { "name": "Wireless Mouse" } },
  { "date": "2025-07-02", "productName": "Mechanical Keyboard", "quantity": 1, "price": 89.50, "total": 89.50, "product": { "name": "Mechanical Keyboard" } },
  { "date": "2025-07-03", "productName": "USB-C Hub", "quantity": 3, "price": 15.75, "total": 47.25, "product": { "name": "USB-C Hub" } },
  { "date": "2025-07-03", "productName": "Laptop Stand", "quantity": 1, "price": 32.90, "total": 32.90, "product": { "name": "Laptop Stand" } },
  { "date": "2025-07-04", "productName": "Webcam", "quantity": 2, "price": 45.00, "total": 90.00, "product": { "name": "Webcam" } },
  { "date": "2025-07-05", "productName": "Bluetooth Speaker", "quantity": 1, "price": 59.99, "total": 59.99, "product": { "name": "Bluetooth Speaker" } },
  { "date": "2025-07-06", "productName": "Desk Lamp", "quantity": 2, "price": 22.50, "total": 45.00, "product": { "name": "Desk Lamp" } },
  { "date": "2025-07-06", "productName": "External SSD", "quantity": 1, "price": 109.99, "total": 109.99, "product": { "name": "External SSD" } },
  { "date": "2025-07-07", "productName": "HDMI Cable", "quantity": 5, "price": 8.25, "total": 41.25, "product": { "name": "HDMI Cable" } },
  { "date": "2025-07-08", "productName": "Smartphone Holder", "quantity": 3, "price": 12.90, "total": 38.70, "product": { "name": "Smartphone Holder" } },
  { "date": "2025-07-09", "productName": "Gaming Headset", "quantity": 1, "price": 75.00, "total": 75.00, "product": { "name": "Gaming Headset" } },
  { "date": "2025-07-09", "productName": "Power Bank", "quantity": 2, "price": 29.95, "total": 59.90, "product": { "name": "Power Bank" } },
  { "date": "2025-07-10", "productName": "Wireless Charger", "quantity": 1, "price": 24.99, "total": 24.99, "product": { "name": "Wireless Charger" } },
  { "date": "2025-07-10", "productName": "Ergonomic Chair", "quantity": 1, "price": 199.90, "total": 199.90, "product": { "name": "Ergonomic Chair" } },
  { "date": "2025-07-11", "productName": "Monitor 27\"", "quantity": 2, "price": 149.99, "total": 299.98, "product": { "name": "Monitor 27\"" } },
  { "date": "2025-07-12", "productName": "Desk Mat", "quantity": 3, "price": 10.00, "total": 30.00, "product": { "name": "Desk Mat" } },
  { "date": "2025-07-13", "productName": "Smart LED Bulb", "quantity": 4, "price": 9.99, "total": 39.96, "product": { "name": "Smart LED Bulb" } },
  { "date": "2025-07-14", "productName": "Streaming Microphone", "quantity": 1, "price": 139.00, "total": 139.00, "product": { "name": "Streaming Microphone" } },
  { "date": "2025-07-15", "productName": "Graphic Tablet", "quantity": 1, "price": 85.50, "total": 85.50, "product": { "name": "Graphic Tablet" } },
  { "date": "2025-07-16", "productName": "Portable Projector", "quantity": 1, "price": 249.99, "total": 249.99, "product": { "name": "Portable Projector" } }
];

