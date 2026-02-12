import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../services/menu';
import { ToastService } from '../../services/toast';
import { MenuItem } from '../../models/menu-item.model';

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrapper fade-in">
      <div class="container-fluid">
        <!-- Dashboard Header -->
        <header class="dash-header">
          <div class="header-content">
            <div class="brand-zone">
              <span class="badge-premium">Owner Dashboard</span>
              <h1>Menu <span class="highlight">Architect</span></h1>
              <p>Design and deploy your restaurant's legendary dishes with ease.</p>
            </div>
            <div class="stats-zone">
              <div class="stat-pill">
                <span class="val">{{ menuItems().length }}</span>
                <span class="lbl">Dishes in Vault</span>
              </div>
              <button (click)="openModal()" class="btn-add">
                <span class="icon">+</span> <span>New Creation</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Main Collection Table -->
        <div class="collection-vault glass-card">
          <div class="vault-header">
            <h3>Dishes Collection</h3>
          </div>
          <div class="scroll-wrapper">
            <table class="menu-table">
              <thead>
                <tr>
                  <th>Item Details</th>
                  <th>Classification</th>
                  <th>Kitchen Tag</th>
                  <th>Price Configuration</th>
                  <th>Visibility</th>
                  <th class="text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of menuItems()" [class.draft]="!item.isAvailable">
                  <td class="dish-cell">
                    <div class="img-preview">
                      <img [src]="item.imageUrl" (error)="handleImageError($event)" alt="Dish" />
                    </div>
                    <div class="meta">
                      <strong class="dish-name">{{ item.name }}</strong>
                      <span class="dish-id">ID: {{ item._id | slice: -6 }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="cat-pill" [ngClass]="item.category">
                      {{
                        item.category === 'veg'
                          ? 'Veg'
                          : item.category === 'non-veg'
                            ? 'Non-Veg'
                            : 'Drink'
                      }}
                    </span>
                  </td>
                  <td>
                    <span class="tag-pill">{{ item.subCategory }}</span>
                  </td>
                  <td>
                    <div class="pricing-pills" *ngIf="item.pricing.type === 'HALF_FULL'">
                      <span class="price-pill half" title="Half Portion"
                        >H: ₹{{ item.pricing.priceHalf }}</span
                      >
                      <span class="price-pill full" title="Full Portion"
                        >F: ₹{{ item.pricing.priceFull }}</span
                      >
                    </div>
                    <div class="pricing-pills" *ngIf="item.pricing.type === 'SINGLE'">
                      <span class="price-pill flat">₹{{ item.pricing.price }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="status-indicator" [class.online]="item.isAvailable">
                      <span class="dot"></span>
                      {{ item.isAvailable ? 'Customer Menu' : 'Kitchen Only' }}
                    </div>
                  </td>
                  <td class="actions-cell">
                    <button (click)="editItem(item)" class="action-btn edit">Edit</button>
                    <button (click)="deleteItem(item._id!)" class="action-btn delete">
                      Delete
                    </button>
                  </td>
                </tr>
                <tr *ngIf="menuItems().length === 0">
                  <td colspan="6" class="empty-state">
                    <div class="empty-msg">
                      <p>Your menu is currently empty.</p>
                      <button (click)="openModal()">Add your first dish</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="isModalOpen" class="modal-overlay" (click)="onBackdropClick($event)">
        <div class="modal glass-card animate-pop" (click)="$event.stopPropagation()">
          <header class="modal-header">
            <div class="header-text">
              <span class="modal-badge">{{ isEditing ? 'Modification' : 'Creation' }}</span>
              <h3>{{ isEditing ? 'Edit Dish' : 'Add New Dish' }}</h3>
              <p>Define the culinary details for your masterpiece.</p>
            </div>
            <button (click)="closeModal()" class="close-modal">&times;</button>
          </header>

          <form (ngSubmit)="onSubmit()" #menuForm="ngForm" class="modal-form">
            <div class="form-body">
              <div class="form-grid">
                <!-- Name -->
                <div class="field full-width">
                  <label>Dish Identity</label>
                  <input
                    [(ngModel)]="currentItem.name"
                    name="name"
                    placeholder="e.g. Tandoori Flame Chicken"
                    required
                    #name="ngModel"
                  />
                  <small *ngIf="name.invalid && name.touched" class="error-text"
                    >Identity is required</small
                  >
                </div>

                <!-- Image -->
                <div class="field full-width">
                  <label>Image Resource URL</label>
                  <input
                    [(ngModel)]="currentItem.imageUrl"
                    name="imageUrl"
                    placeholder="https://..."
                    required
                    #imgUrl="ngModel"
                  />
                  <small *ngIf="imgUrl.invalid && imgUrl.touched" class="error-text"
                    >Valid URL required</small
                  >
                </div>

                <!-- Category -->
                <div class="field">
                  <label>Dietary Class</label>
                  <select
                    [(ngModel)]="currentItem.category"
                    name="category"
                    required
                    (change)="onCategoryChange()"
                  >
                    <option value="veg">VEG</option>
                    <option value="non-veg">NON-VEG</option>
                    <option value="drinks">DRINKS</option>
                  </select>
                </div>

                <!-- Sub Category -->
                <div class="field">
                  <label>Kitchen Section</label>
                  <select [(ngModel)]="currentItem.subCategory" name="subCategory" required>
                    <option *ngFor="let sub of availableSubCategories" [value]="sub">
                      {{ sub }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Pricing Section - REDESIGNED FOR PERFECT CONTAINMENT -->
              <div class="pricing-vault">
                <div class="vault-header-row">
                  <span class="vault-label">Pricing Architecture</span>
                  <div class="toggle-group">
                    <button
                      type="button"
                      [class.selected]="currentItem.pricing?.type === 'SINGLE'"
                      (click)="setPricingType('SINGLE')"
                    >
                      Flat
                    </button>
                    <button
                      type="button"
                      [class.selected]="currentItem.pricing?.type === 'HALF_FULL'"
                      (click)="setPricingType('HALF_FULL')"
                    >
                      Portions
                    </button>
                  </div>
                </div>

                <div class="vault-content">
                  <!-- Single Configuration -->
                  <div *ngIf="currentItem.pricing?.type === 'SINGLE'" class="config-single fade-in">
                    <div class="field">
                      <label>Standard Price (₹)</label>
                      <div class="input-with-symbol">
                        <span class="symbol">₹</span>
                        <input
                          type="number"
                          [(ngModel)]="currentItem.pricing!.price"
                          name="price"
                          required
                          min="1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Portions Configuration - NESTED GRID -->
                  <div
                    *ngIf="currentItem.pricing?.type === 'HALF_FULL'"
                    class="config-portions fade-in"
                  >
                    <div class="portion-card">
                      <div class="field">
                        <label>Half Price</label>
                        <div class="input-with-symbol">
                          <span class="symbol">₹</span>
                          <input
                            type="number"
                            [(ngModel)]="currentItem.pricing!.priceHalf"
                            name="priceHalf"
                            required
                            min="1"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="portion-card">
                      <div class="field">
                        <label>Full Price</label>
                        <div class="input-with-symbol">
                          <span class="symbol">₹</span>
                          <input
                            type="number"
                            [(ngModel)]="currentItem.pricing!.priceFull"
                            name="priceFull"
                            required
                            min="1"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Visibility Switch -->
              <div class="form-footer-actions">
                <label class="switch-container">
                  <input type="checkbox" [(ngModel)]="currentItem.isAvailable" name="isAvailable" />
                  <span class="slider"></span>
                  <span class="lbl-text">Display in customer menu immediately</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" (click)="closeModal()" class="btn-cancel">Discard</button>
              <button type="submit" class="btn-confirm" [disabled]="menuForm.invalid">
                {{ isEditing ? 'Sync Changes' : 'Confirm & Publish' }}
              </button>
            </div>
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
        padding: 100px 24px 60px;
        font-family: 'Poppins', sans-serif;
      }
      .container-fluid {
        max-width: 1400px;
        margin: 0 auto;
      }
      .highlight {
        color: #ff6600;
      }

      /* Header */
      .dash-header {
        margin-bottom: 60px;
      }
      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 30px;
      }
      .badge-premium {
        display: inline-block;
        padding: 4px 12px;
        background: rgba(255, 102, 0, 0.1);
        color: #ff6600;
        border-radius: 50px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .brand-zone h1 {
        font-size: clamp(2.2rem, 6vw, 3.8rem);
        font-weight: 900;
        margin: 0;
        line-height: 1;
        letter-spacing: -2.5px;
      }
      .brand-zone p {
        color: #666;
        margin-top: 10px;
        font-size: 1.1rem;
      }
      .stats-zone {
        display: flex;
        align-items: center;
        gap: 40px;
      }
      .stat-pill {
        text-align: right;
        border-right: 1px solid #1a1a1a;
        padding-right: 40px;
      }
      .stat-pill .val {
        display: block;
        font-size: 2.8rem;
        font-weight: 900;
        color: #ff6600;
        line-height: 1;
      }
      .stat-pill .lbl {
        font-size: 0.75rem;
        color: #444;
        text-transform: uppercase;
        font-weight: 700;
      }
      .btn-add {
        background: #fff;
        color: #000;
        border: none;
        padding: 18px 36px;
        border-radius: 20px;
        font-weight: 900;
        cursor: pointer;
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .btn-add:hover {
        transform: translateY(-5px);
        background: #ff6600;
        color: #fff;
      }

      /* Table UI */
      .collection-vault {
        border-radius: 40px;
        border: 1px solid #1a1a1a;
        background: rgba(15, 15, 15, 0.6);
        backdrop-filter: blur(20px);
        overflow: hidden;
      }
      .vault-header {
        padding: 35px 40px;
        border-bottom: 1px solid #1a1a1a;
      }
      .vault-header h3 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 900;
      }
      .scroll-wrapper {
        overflow-x: auto;
      }
      .menu-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 1000px;
      }
      .menu-table th {
        padding: 24px 40px;
        text-align: left;
        background: rgba(255, 255, 255, 0.015);
        color: #555;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      .menu-table td {
        padding: 22px 40px;
        border-bottom: 1px solid #141414;
        vertical-align: middle;
      }
      .draft {
        opacity: 0.45;
        filter: grayscale(0.5);
      }
      .dish-cell {
        display: flex;
        align-items: center;
        gap: 24px;
      }
      .img-preview {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #222;
      }
      .img-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .cat-pill {
        font-size: 0.65rem;
        font-weight: 900;
        padding: 6px 16px;
        border-radius: 50px;
        text-transform: uppercase;
      }
      .cat-pill.veg {
        color: #2ecc71;
        background: rgba(46, 204, 113, 0.08);
      }
      .cat-pill.non-veg {
        color: #e74c3c;
        background: rgba(231, 76, 60, 0.08);
      }
      .cat-pill.drinks {
        color: #3498db;
        background: rgba(52, 152, 219, 0.08);
      }
      .tag-pill {
        font-size: 0.7rem;
        color: #888;
        background: #1a1a1a;
        padding: 6px 14px;
        border-radius: 10px;
      }
      .pricing-pills {
        display: flex;
        gap: 10px;
      }
      .price-pill {
        padding: 7px 14px;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 800;
      }
      .price-pill.half {
        background: rgba(255, 102, 0, 0.05);
        color: #ff6600;
      }
      .price-pill.full {
        background: #ff6600;
        color: #fff;
      }
      .price-pill.flat {
        background: #1a1a1a;
        color: #fff;
      }
      .status-indicator {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #444;
      }
      .status-indicator.online {
        color: #2ecc71;
      }
      .status-indicator .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }
      .actions-cell {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .action-btn {
        padding: 10px 20px;
        border-radius: 14px;
        font-weight: 800;
        font-size: 0.75rem;
        cursor: pointer;
        transition: 0.3s;
        border: 1px solid transparent;
      }
      .action-btn.edit {
        background: #1a1a1a;
        color: #666;
      }
      .action-btn.edit:hover {
        background: #fff;
        color: #000;
      }
      .action-btn.delete {
        background: rgba(231, 76, 60, 0.04);
        color: #e74c3c;
      }
      .action-btn.delete:hover {
        background: #e74c3c;
        color: #fff;
      }

      /* MODAL REPAIR - FIXED VIEWPORT */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(25px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .modal {
        position: relative;
        width: 100%;
        max-width: 680px;
        max-height: 90vh;
        background: #0d0d0d;
        border: 1px solid #1a1a1a;
        border-radius: 40px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 50px 150px rgba(0, 0, 0, 0.9);
        overflow: hidden;
      }

      .modal-header {
        padding: 35px 45px 20px;
        border-bottom: 1px solid #141414;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-shrink: 0;
      }

      .modal-form {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow: hidden;
      }

      .form-body {
        padding: 30px 45px;
        overflow-y: auto;
        flex: 1;
        scrollbar-width: thin;
        scrollbar-color: #222 transparent;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 25px;
      }
      .field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .field.full-width {
        grid-column: 1 / span 2;
      }
      .field label {
        font-size: 0.7rem;
        font-weight: 800;
        color: #444;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .field input,
      .field select {
        background: #000;
        border: 1px solid #1a1a1a;
        padding: 16px;
        border-radius: 16px;
        color: #fff;
        font-family: inherit;
        font-size: 1rem;
        width: 100%;
        box-sizing: border-box;
      }
      .field input:focus {
        border-color: #ff6600;
        outline: none;
      }

      /* PRICING VAULT - THE "INSIDE" FIX */
      .pricing-vault {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid #1a1a1a;
        border-radius: 28px;
        padding: 24px;
        margin: 25px 0;
        width: 100%;
        box-sizing: border-box;
      }
      .vault-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .toggle-group {
        display: flex;
        background: #000;
        padding: 5px;
        border-radius: 14px;
        border: 1px solid #111;
      }
      .toggle-group button {
        background: transparent;
        border: none;
        color: #444;
        padding: 8px 18px;
        border-radius: 10px;
        font-weight: 800;
        cursor: pointer;
        font-size: 0.75rem;
      }
      .toggle-group button.selected {
        background: #ff6600;
        color: #fff;
      }

      /* PORTIONS GRID SYSTEM */
      .config-portions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        width: 100%;
      }
      .portion-card {
        background: rgba(0, 0, 0, 0.3);
        padding: 15px;
        border-radius: 20px;
        border: 1px solid #1a1a1a;
      }

      .input-with-symbol {
        position: relative;
        width: 100%;
      }
      .input-with-symbol .symbol {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #444;
        font-weight: 900;
        pointer-events: none;
      }
      .input-with-symbol input {
        padding-left: 42px !important;
      }

      /* VISIBILITY SWITCH */
      .switch-container {
        display: flex;
        align-items: center;
        gap: 15px;
        cursor: pointer;
        margin-top: 10px;
      }
      .switch-container input {
        display: none;
      }
      .slider {
        width: 50px;
        height: 26px;
        background: #111;
        border-radius: 50px;
        position: relative;
        transition: 0.4s;
        border: 1px solid #222;
      }
      .slider::after {
        content: '';
        position: absolute;
        left: 4px;
        top: 4px;
        width: 18px;
        height: 18px;
        background: #444;
        border-radius: 50%;
        transition: 0.4s;
      }
      input:checked + .slider {
        background: #2ecc71;
        border-color: #2ecc71;
      }
      input:checked + .slider::after {
        transform: translateX(24px);
        background: #fff;
      }
      .lbl-text {
        color: #666;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .modal-footer {
        padding: 25px 45px;
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        background: #080808;
        border-top: 1px solid #141414;
        flex-shrink: 0;
      }
      .btn-cancel {
        background: #1a1a1a;
        color: #555;
        border: none;
        padding: 14px 25px;
        border-radius: 16px;
        font-weight: 800;
        cursor: pointer;
      }
      .btn-confirm {
        background: #ff6600;
        color: #fff;
        border: none;
        padding: 14px 40px;
        border-radius: 16px;
        font-weight: 900;
        cursor: pointer;
      }
      .btn-confirm:disabled {
        opacity: 0.2;
        cursor: not-allowed;
      }

      .close-modal {
        background: #1a1a1a;
        border: none;
        color: #444;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .modal {
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
        }
        .form-grid {
          grid-template-columns: 1fr;
        }
        .config-portions {
          grid-template-columns: 1fr;
        }
      }
      .fade-in {
        animation: fadeIn 0.4s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-pop {
        animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      .error-text {
        color: #ff4444;
        font-size: 0.7rem;
        font-weight: 700;
      }
    `,
  ],
})
export class MenuManagementComponent implements OnInit {
  menuService = inject(MenuService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  menuItems = signal<MenuItem[]>([]);
  isModalOpen = false;
  isEditing = false;
  currentItem: Partial<MenuItem> = this.getEmptyItem();

  foodSubCats = ['INDIAN', 'CHINESE', 'STARTERS', 'SIDES'];
  drinksSubCats = ['DRINKS'];
  availableSubCategories: string[] = [];

  ngOnInit() {
    this.loadMenu();
  }

  loadMenu() {
    this.menuService.getAllMenuItems().subscribe({
      next: (d) => this.menuItems.set(d),
      error: () => this.toast.error('Failed to sync menu collection.'),
    });
  }

  getEmptyItem(): Partial<MenuItem> {
    return {
      name: '',
      category: 'veg',
      subCategory: 'INDIAN',
      imageUrl: '',
      isAvailable: true,
      pricing: { type: 'SINGLE', price: 0, priceHalf: 0, priceFull: 0 },
    };
  }

  onCategoryChange() {
    if (this.currentItem.category === 'drinks') {
      this.availableSubCategories = this.drinksSubCats;
      this.currentItem.subCategory = 'DRINKS';
    } else {
      this.availableSubCategories = this.foodSubCats;
      if (this.currentItem.subCategory === 'DRINKS') {
        this.currentItem.subCategory = 'INDIAN';
      }
    }
  }

  setPricingType(type: 'SINGLE' | 'HALF_FULL') {
    if (this.currentItem.pricing) {
      this.currentItem.pricing.type = type;
    }
  }

  openModal() {
    this.isEditing = false;
    this.currentItem = this.getEmptyItem();
    this.onCategoryChange();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  editItem(item: MenuItem) {
    this.isEditing = true;
    this.currentItem = JSON.parse(JSON.stringify(item));
    this.onCategoryChange();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.closeModal();
    }
  }

  deleteItem(id: string) {
    if (!confirm('This action will permanently erase the dish from the database. Proceed?')) return;
    this.menuService.deleteMenuItem(id).subscribe({
      next: () => {
        setTimeout(() => {
          this.toast.success('Dish removed successfully.');
          this.loadMenu();
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast.error('Failed to remove dish.'),
    });
  }

  onSubmit() {
    const action = this.isEditing
      ? this.menuService.updateMenuItem(this.currentItem._id!, this.currentItem)
      : this.menuService.addMenuItem(this.currentItem);

    action.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast.success(`Dish ${this.isEditing ? 'updated' : 'published'} successfully.`);
          this.loadMenu();
          this.closeModal();
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        setTimeout(() => {
          this.toast.error(e.error?.msg || 'Failed to sync dish.');
        });
      },
    });
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}
