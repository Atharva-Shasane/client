import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { MenuItem } from '../../models/menu-item.model';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="header">
        <h2>Menu Management</h2>
        <button (click)="openModal()" class="add-btn">+ Add New Item</button>
      </div>

      <!-- Items Table -->
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of menuItems()">
              <td><img [src]="item.imageUrl" class="thumb" alt="Item" /></td>
              <td>
                <strong>{{ item.name }}</strong
                ><br />
                <small>{{ item.subCategory }}</small>
              </td>
              <td>{{ item.category }}</td>
              <td>
                <div *ngIf="item.pricing.type === 'SINGLE'">₹{{ item.pricing.price }}</div>
                <div *ngIf="item.pricing.type === 'HALF_FULL'">
                  H: ₹{{ item.pricing.priceHalf }} / F: ₹{{ item.pricing.priceFull }}
                </div>
              </td>
              <td>
                <span
                  class="badge"
                  [class.available]="item.isAvailable"
                  [class.unavailable]="!item.isAvailable"
                >
                  {{ item.isAvailable ? 'Active' : 'Hidden' }}
                </span>
              </td>
              <td>
                <button (click)="editItem(item)" class="action-btn edit">Edit</button>
                <button *ngIf="item._id" (click)="deleteItem(item._id!)" class="action-btn delete">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="isModalOpen" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Item' : 'Add New Item' }}</h3>
          <form (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group">
                <label>Name</label>
                <input [(ngModel)]="currentItem.name" name="name" required />
              </div>
              <div class="form-group">
                <label>Image URL</label>
                <input [(ngModel)]="currentItem.imageUrl" name="imageUrl" required />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="currentItem.category" name="category" required>
                  <option value="veg-indian">Veg Indian</option>
                  <option value="non-veg-indian">Non-Veg Indian</option>
                  <option value="beverages">Beverages</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sub Category</label>
                <input [(ngModel)]="currentItem.subCategory" name="subCategory" required />
              </div>
            </div>

            <!-- Pricing Section -->
            <div class="pricing-section">
              <label>Pricing Type</label>
              <select
                [(ngModel)]="currentItem.pricing!.type"
                name="pricingType"
                style="margin-bottom: 10px; width: 100%;"
              >
                <option value="SINGLE">Single Price</option>
                <option value="HALF_FULL">Half/Full</option>
              </select>

              <div *ngIf="currentItem.pricing!.type === 'SINGLE'" class="form-group">
                <label>Price (₹)</label>
                <input type="number" [(ngModel)]="currentItem.pricing!.price" name="price" />
              </div>

              <div *ngIf="currentItem.pricing!.type === 'HALF_FULL'" class="form-grid">
                <div class="form-group">
                  <label>Half Price (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="currentItem.pricing!.priceHalf"
                    name="priceHalf"
                  />
                </div>
                <div class="form-group">
                  <label>Full Price (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="currentItem.pricing!.priceFull"
                    name="priceFull"
                  />
                </div>
              </div>
            </div>

            <div class="form-group checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="currentItem.isAvailable" name="isAvailable" />
                Available to Customers?
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" (click)="closeModal()" class="cancel-btn">Cancel</button>
              <button type="submit" class="save-btn">Save Item</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-container {
        padding: 2rem;
        background: #f8f9fa;
        min-height: 100vh;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .add-btn {
        background: #ff6600;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
      }
      .table-responsive {
        overflow-x: auto;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 15px;
        text-align: left;
        border-bottom: 1px solid #eee;
      }
      th {
        background: #333;
        color: white;
      }
      .thumb {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
      }
      .action-btn {
        background: #333;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 5px;
      }
      .action-btn.delete {
        background: #ff4444;
      }
      .badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: bold;
      }
      .available {
        background: #d4edda;
        color: #155724;
      }
      .unavailable {
        background: #f8d7da;
        color: #721c24;
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      .modal {
        background: white;
        padding: 2rem;
        border-radius: 10px;
        width: 500px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      .form-group {
        margin-bottom: 15px;
      }
      .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      }
      .pricing-section {
        background: #f9f9f9;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 15px;
        border: 1px solid #eee;
      }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 20px;
      }
      .save-btn {
        background: #28a745;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .cancel-btn {
        background: #6c757d;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .checkbox input {
        width: auto;
      }
    `,
  ],
})
export class MenuManagementComponent implements OnInit {
  menuService = inject(MenuService);
  toast = inject(ToastService);
  menuItems = signal<MenuItem[]>([]);
  isModalOpen = false;
  isEditing = false;
  currentItem: Partial<MenuItem> = this.getEmptyItem();

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.menuService.getAllMenuItems().subscribe({
      next: (data) => this.menuItems.set(data),
      error: () => this.toast.error('Failed to load menu data'),
    });
  }

  getEmptyItem(): Partial<MenuItem> {
    return {
      name: '',
      category: 'veg-indian',
      subCategory: '',
      imageUrl: '',
      isAvailable: true,
      pricing: { type: 'SINGLE', price: 0, priceHalf: 0, priceFull: 0 },
    };
  }

  openModal() {
    this.isEditing = false;
    this.currentItem = this.getEmptyItem();
    this.isModalOpen = true;
  }

  editItem(item: MenuItem) {
    this.isEditing = true;
    this.currentItem = JSON.parse(JSON.stringify(item));
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  deleteItem(id: string) {
    if (!confirm('Delete this item permanently?')) return;
    this.menuService.deleteMenuItem(id).subscribe({
      next: () => {
        this.toast.success('Item deleted successfully');
        this.loadMenu();
      },
      error: () => this.toast.error('Failed to delete item'),
    });
  }

  onSubmit() {
    const action = this.isEditing
      ? this.menuService.updateMenuItem(this.currentItem._id!, this.currentItem)
      : this.menuService.addMenuItem(this.currentItem);

    action.subscribe({
      next: () => {
        this.toast.success(this.isEditing ? 'Item updated successfully' : 'New item added');
        this.loadMenu();
        this.closeModal();
      },
      error: (err) => {
        this.toast.error(err.error?.msg || 'Operation failed');
      },
    });
  }
}
