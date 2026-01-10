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
    <div class="admin-wrapper fade-in">
      <div class="container-fluid">
        <header class="header">
          <div class="title-group">
            <h1>Menu <span class="highlight">Master</span></h1>
            <p>Curate your restaurant's digital collection</p>
          </div>
          <button (click)="openModal()" class="btn-add">+ New Item</button>
        </header>

        <div class="table-container glass-card">
          <table class="menu-table">
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Pricing Structure</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of menuItems()" [class.hidden]="!item.isAvailable">
                <td class="dish-cell">
                  <img [src]="item.imageUrl" alt="Food" />
                  <div class="meta">
                    <strong>{{ item.name }}</strong>
                    <span>{{ item.subCategory }}</span>
                  </div>
                </td>
                <td>
                  <span class="cat-chip">{{ item.category | uppercase }}</span>
                </td>
                <td class="price-cell">
                  <div *ngIf="item.pricing.type === 'SINGLE'" class="p-single">
                    ₹{{ item.pricing.price }}
                  </div>
                  <div *ngIf="item.pricing.type === 'HALF_FULL'" class="p-variants">
                    <span>H: ₹{{ item.pricing.priceHalf }}</span>
                    <span>F: ₹{{ item.pricing.priceFull }}</span>
                  </div>
                </td>
                <td>
                  <span class="status-badge" [class.active]="item.isAvailable">
                    {{ item.isAvailable ? 'LIVE' : 'HIDDEN' }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button (click)="editItem(item)" class="btn-edit">Edit</button>
                  <button (click)="deleteItem(item._id!)" class="btn-del">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="isModalOpen" class="modal-overlay">
        <div class="modal glass-card">
          <header class="modal-header">
            <h3>{{ isEditing ? 'Update Creation' : 'Add New Item' }}</h3>
            <button (click)="closeModal()" class="close-modal">&times;</button>
          </header>

          <form (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-grid">
              <div class="field">
                <label>Dish Name</label>
                <input
                  [(ngModel)]="currentItem.name"
                  name="name"
                  placeholder="e.g. Legendary Butter Chicken"
                  required
                />
              </div>
              <div class="field">
                <label>Image URL</label>
                <input
                  [(ngModel)]="currentItem.imageUrl"
                  name="imageUrl"
                  placeholder="HTTPS Link"
                  required
                />
              </div>
              <div class="field">
                <label>Category</label>
                <select [(ngModel)]="currentItem.category" name="category" required>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="drinks">Drinks</option>
                </select>
              </div>
              <div class="field">
                <label>Sub Category</label>
                <input
                  [(ngModel)]="currentItem.subCategory"
                  name="subCategory"
                  placeholder="e.g. Appetizer / Soda"
                  required
                />
              </div>
            </div>

            <div class="pricing-config">
              <div class="field">
                <label>Pricing Model</label>
                <select [(ngModel)]="currentItem.pricing!.type" name="pricingType">
                  <option value="SINGLE">Flat Price</option>
                  <option value="HALF_FULL">Variant Pricing (Half/Full)</option>
                </select>
              </div>

              <div *ngIf="currentItem.pricing!.type === 'SINGLE'" class="field fade-in">
                <label>Amount (₹)</label>
                <input type="number" [(ngModel)]="currentItem.pricing!.price" name="price" />
              </div>

              <div *ngIf="currentItem.pricing!.type === 'HALF_FULL'" class="dual-fields fade-in">
                <div class="field">
                  <label>Half (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="currentItem.pricing!.priceHalf"
                    name="priceHalf"
                  />
                </div>
                <div class="field">
                  <label>Full (₹)</label>
                  <input
                    type="number"
                    [(ngModel)]="currentItem.pricing!.priceFull"
                    name="priceFull"
                  />
                </div>
              </div>
            </div>

            <div class="availability">
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="currentItem.isAvailable" name="isAvailable" />
                <span class="slider"></span>
                Show in Customer Menu
              </label>
            </div>

            <button type="submit" class="btn-save">
              {{ isEditing ? 'Sync Changes' : 'Publish Dish' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-wrapper {
        background: #0a0a0a;
        min-height: 100vh;
        color: white;
        padding: 120px 24px 60px;
        font-family: 'Poppins', sans-serif;
      }
      .container-fluid {
        max-width: 1400px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 50px;
      }
      .title-group h1 {
        font-size: 3rem;
        font-weight: 900;
        margin: 0;
        letter-spacing: -1.5px;
      }
      .highlight {
        color: #ff6600;
      }
      .title-group p {
        color: #666;
        margin-top: 5px;
      }

      .btn-add {
        background: #ff6600;
        color: white;
        border: none;
        padding: 14px 30px;
        border-radius: 14px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 8px 25px rgba(255, 107, 0, 0.3);
        transition: 0.3s;
      }
      .btn-add:hover {
        transform: translateY(-3px);
        filter: brightness(1.1);
      }

      .table-container {
        border-radius: 32px;
        overflow: hidden;
        border: 1px solid #222;
      }
      .menu-table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      .menu-table th {
        padding: 25px;
        background: #161616;
        color: #555;
        text-transform: uppercase;
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 1.5px;
      }
      .menu-table td {
        padding: 20px 25px;
        border-bottom: 1px solid #222;
      }

      .dish-cell {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .dish-cell img {
        width: 60px;
        height: 60px;
        border-radius: 14px;
        object-fit: cover;
      }
      .dish-cell .meta {
        display: flex;
        flex-direction: column;
      }
      .dish-cell strong {
        font-size: 1.1rem;
      }
      .dish-cell span {
        font-size: 0.8rem;
        color: #666;
        font-weight: 600;
      }

      .cat-chip {
        font-size: 0.65rem;
        font-weight: 900;
        color: #ff6600;
        background: rgba(255, 102, 0, 0.1);
        padding: 5px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255, 102, 0, 0.2);
      }
      .p-variants {
        display: flex;
        flex-direction: column;
        font-size: 0.8rem;
        color: #888;
        font-weight: 700;
        gap: 3px;
      }
      .p-variants span {
        background: #1a1a1a;
        padding: 2px 8px;
        border-radius: 6px;
      }

      .status-badge {
        font-size: 0.65rem;
        font-weight: 900;
        padding: 5px 12px;
        border-radius: 50px;
        background: #222;
        color: #666;
      }
      .status-badge.active {
        background: rgba(46, 204, 113, 0.1);
        color: #2ecc71;
        border: 1px solid rgba(46, 204, 113, 0.2);
      }

      .actions-cell {
        display: flex;
        gap: 10px;
      }
      .btn-edit {
        background: #222;
        color: #ddd;
        border: 1px solid #333;
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
        transition: 0.2s;
      }
      .btn-edit:hover {
        background: #333;
        border-color: #ff6600;
        color: white;
      }
      .btn-del {
        background: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.2);
        padding: 8px 16px;
        border-radius: 10px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-del:hover {
        background: #e74c3c;
        color: white;
      }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        z-index: 4000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal {
        width: 600px;
        padding: 45px;
        border-radius: 40px;
        border: 1px solid #333;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 35px;
      }
      .modal-header h3 {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 900;
      }
      .close-modal {
        background: #222;
        border: none;
        color: #fff;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .field {
        margin-bottom: 20px;
      }
      .field label {
        display: block;
        font-size: 0.7rem;
        font-weight: 900;
        color: #555;
        text-transform: uppercase;
        margin-bottom: 10px;
        letter-spacing: 1px;
      }
      .field input,
      .field select {
        width: 100%;
        padding: 15px;
        background: #111;
        border: 1px solid #222;
        border-radius: 14px;
        color: white;
        font-family: inherit;
      }

      .pricing-config {
        background: #0a0a0a;
        padding: 25px;
        border-radius: 24px;
        border: 1px solid #222;
        margin: 10px 0 30px;
      }
      .dual-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .availability {
        margin-bottom: 30px;
      }
      .toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 700;
        color: #aaa;
        cursor: pointer;
      }

      .btn-save {
        width: 100%;
        padding: 20px;
        background: #ff6600;
        color: white;
        border: none;
        border-radius: 18px;
        font-weight: 900;
        font-size: 1.1rem;
        cursor: pointer;
        transition: 0.3s;
        box-shadow: 0 10px 25px rgba(255, 107, 0, 0.3);
      }
      .btn-save:hover {
        transform: translateY(-3px);
        filter: brightness(1.1);
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
      next: (d) => this.menuItems.set(d),
      error: () => this.toast.error('Failed to load menu.'),
    });
  }

  getEmptyItem(): Partial<MenuItem> {
    return {
      name: '',
      category: 'veg',
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
    if (!confirm('Erase this dish from existence?')) return;
    this.menuService.deleteMenuItem(id).subscribe({
      next: () => {
        this.toast.success('Dish erased.');
        this.loadMenu();
      },
      error: () => this.toast.error('Failed to delete.'),
    });
  }

  onSubmit() {
    const action = this.isEditing
      ? this.menuService.updateMenuItem(this.currentItem._id!, this.currentItem)
      : this.menuService.addMenuItem(this.currentItem);
    action.subscribe({
      next: () => {
        this.toast.success('Collection synced.');
        this.loadMenu();
        this.closeModal();
      },
      error: (e) => this.toast.error(e.error?.msg || 'Failed to save.'),
    });
  }
}
