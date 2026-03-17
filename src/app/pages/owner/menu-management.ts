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
                <span class="lbl">Total Items</span>
              </div>
              <button (click)="openModal()" class="btn-add">
                <span class="plus">+</span> New Dish
              </button>
            </div>
          </div>
        </header>

        <!-- Collection Vault -->
        <div class="collection-vault">
          <div class="vault-header">
            <h3>Live Menu Collection</h3>
          </div>
          <div class="scroll-wrapper">
            <table class="menu-table">
              <thead>
                <tr>
                  <th>Dish Identity</th>
                  <th>Category</th>
                  <th>Sub Category</th>
                  <th>Pricing Model</th>
                  <th>Status</th>
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
                  <td><span class="tag-pill">{{ item.subCategory }}</span></td>
                  <td>
                    <div class="pricing-pills">
                      <span *ngIf="item.pricing.type === 'SINGLE'" class="price-pill flat">
                        ₹{{ item.pricing.price }}
                      </span>
                      <ng-container *ngIf="item.pricing.type === 'HALF_FULL'">
                        <span class="price-pill half">H: ₹{{ item.pricing.priceHalf }}</span>
                        <span class="price-pill full">F: ₹{{ item.pricing.priceFull }}</span>
                      </ng-container>
                    </div>
                  </td>
                  <td>
                    <div class="status-indicator" [class.online]="item.isAvailable">
                      <span class="dot"></span>
                      {{ item.isAvailable ? 'Active' : 'Draft' }}
                    </div>
                  </td>
                  <td class="actions-cell">
                    <button (click)="editItem(item)" class="action-btn edit">Edit</button>
                    <button (click)="deleteItem(item._id!)" class="action-btn delete">Delete</button>
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
    </div>

    <!-- Add/Edit Modal -->
    <div *ngIf="isModalOpen" class="modal-overlay" (click)="onBackdropClick($event)">
      <div class="modal glass-card animate-pop" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-text">
            <span class="modal-badge">{{ isEditing ? 'Modification' : 'Creation' }}</span>
            <h2>{{ isEditing ? 'Edit Dish' : 'New Culinary Entry' }}</h2>
          </div>
          <button (click)="closeModal()" class="close-modal">×</button>
        </header>

        <form #menuForm="ngForm" (ngSubmit)="saveItem()" class="modal-form">
          <div class="scroll-body">
            <div class="form-grid">
              <!-- Name -->
              <div class="field full-width">
                <label>Dish Name</label>
                <input
                  [(ngModel)]="currentItem.name"
                  name="name"
                  placeholder="e.g. Legendary Killa Burger"
                  required
                />
              </div>

              <!-- Image Upload -->
              <div class="field full-width">
                <label>Dish Image (Cloudinary CDN)</label>
                <div class="upload-zone" [class.has-preview]="imagePreview">
                  <input
                    type="file"
                    (change)="onFileSelected($event)"
                    accept="image/*"
                    id="fileInput"
                    hidden
                  />
                  <label for="fileInput" class="upload-trigger">
                    <div *ngIf="!imagePreview && !currentItem.imageUrl" class="upload-placeholder">
                      <span class="up-icon">📷</span>
                      <p>Click to upload dish photo</p>
                      <small>Max size: 5MB (JPG, PNG, WEBP)</small>
                    </div>
                    <img *ngIf="imagePreview || currentItem.imageUrl" 
                         [src]="imagePreview || currentItem.imageUrl" 
                         class="upload-preview" />
                    <div *ngIf="imagePreview || currentItem.imageUrl" class="change-overlay">
                      Change Photo
                    </div>
                  </label>
                </div>
              </div>

              <!-- Category -->
              <div class="field">
                <label>Dietary Class</label>
                <select [(ngModel)]="currentItem.category" name="category" required (change)="onCategoryChange()">
                  <option value="veg">VEG</option>
                  <option value="non-veg">NON-VEG</option>
                  <option value="drinks">DRINKS</option>
                </select>
              </div>

              <!-- Sub Category -->
              <div class="field">
                <label>Sub Category</label>
                <select [(ngModel)]="currentItem.subCategory" name="subCategory" required>
                  <option *ngFor="let sc of availableSubCategories" [value]="sc">{{ sc }}</option>
                </select>
              </div>
            </div>

            <!-- Pricing Vault -->
            <div class="pricing-vault">
              <div class="vault-head">
                <label>Pricing Configuration</label>
                <div class="toggle-group">
                  <button
                    type="button"
                    [class.selected]="currentItem.pricing?.type === 'SINGLE'"
                    (click)="setPricingType('SINGLE')"
                  >
                    Flat Rate
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
                <!-- Single Price -->
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

                <!-- Portions Configuration -->
                <div *ngIf="currentItem.pricing?.type === 'HALF_FULL'" class="config-portions fade-in">
                  <div class="portion-card">
                    <label>Half Portion (₹)</label>
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
                  <div class="portion-card">
                    <label>Full Portion (₹)</label>
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
            <button type="submit" class="btn-confirm" [disabled]="menuForm.invalid || loading">
              <span *ngIf="loading" class="btn-spinner"></span>
              {{ isEditing ? 'Sync Changes' : 'Confirm & Publish' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
    .admin-wrapper { background: #0a0a0a; min-height: 100vh; color: white; padding-top: 100px; padding-bottom: 60px; font-family: 'Poppins', sans-serif; }
    .container-fluid { max-width: 1400px; margin: 0 auto; padding: 0 30px; }
    .highlight { color: #ff6600; }
    
    .dash-header { margin-bottom: 50px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 30px; }
    .badge-premium { display: inline-block; padding: 4px 12px; background: rgba(255, 102, 0, 0.1); color: #ff6600; border-radius: 50px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; }
    .brand-zone h1 { font-size: clamp(2.2rem, 6vw, 3.8rem); font-weight: 900; margin: 0; line-height: 1; letter-spacing: -2.5px; }
    .brand-zone p { color: #666; margin-top: 10px; font-size: 1.1rem; }
    
    .stats-zone { display: flex; align-items: center; gap: 40px; }
    .stat-pill { text-align: right; border-right: 1px solid #1a1a1a; padding-right: 40px; }
    .stat-pill .val { display: block; font-size: 2.8rem; font-weight: 900; color: #fff; line-height: 1; }
    .stat-pill .lbl { font-size: 0.75rem; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 1px; }
    
    .btn-add { background: #fff; color: #000; border: none; padding: 18px 35px; border-radius: 20px; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 12px; font-size: 1rem; }
    .btn-add:hover { transform: translateY(-5px); background: #ff6600; color: #fff; }
    .btn-add .plus { font-size: 1.5rem; line-height: 0; }

    /* Table UI */
    .collection-vault { border-radius: 40px; border: 1px solid #1a1a1a; background: rgba(15, 15, 15, 0.6); backdrop-filter: blur(20px); overflow: hidden; }
    .vault-header { padding: 35px 40px; border-bottom: 1px solid #1a1a1a; }
    .vault-header h3 { margin: 0; font-size: 1.4rem; font-weight: 900; }
    .scroll-wrapper { overflow-x: auto; }
    .menu-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
    .menu-table th { padding: 24px 40px; text-align: left; background: rgba(255, 255, 255, 0.015); color: #444; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; }
    .menu-table td { padding: 20px 40px; border-bottom: 1px solid #141414; vertical-align: middle; }
    
    .dish-cell { display: flex; align-items: center; gap: 24px; }
    .img-preview { width: 64px; height: 64px; border-radius: 18px; overflow: hidden; border: 1px solid #222; }
    .img-preview img { width: 100%; height: 100%; object-fit: cover; }
    .meta { display: flex; flex-direction: column; }
    .dish-name { font-size: 1.1rem; font-weight: 700; color: #eee; }
    .dish-id { font-size: 0.7rem; color: #444; font-family: monospace; margin-top: 4px; }
    
    .cat-pill { font-size: 0.65rem; font-weight: 900; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; }
    .cat-pill.veg { color: #2ecc71; background: rgba(46, 204, 113, 0.08); }
    .cat-pill.non-veg { color: #e74c3c; background: rgba(231, 76, 60, 0.08); }
    .cat-pill.drinks { color: #3498db; background: rgba(52, 152, 219, 0.08); }
    
    .tag-pill { font-size: 0.7rem; color: #888; background: #1a1a1a; padding: 6px 14px; border-radius: 10px; font-weight: 700; }
    .pricing-pills { display: flex; gap: 8px; }
    .price-pill { font-size: 0.8rem; font-weight: 800; padding: 6px 12px; border-radius: 10px; }
    .price-pill.flat { background: #1a1a1a; color: #fff; }
    .price-pill.half { background: rgba(255, 204, 0, 0.1); color: #ffcc00; }
    .price-pill.full { background: #ff6600; color: #fff; }
    
    .status-indicator { display: flex; align-items: center; gap: 10px; font-size: 0.8rem; font-weight: 700; color: #444; }
    .status-indicator.online { color: #2ecc71; }
    .status-indicator .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    
    .actions-cell { display: flex; gap: 12px; justify-content: flex-end; }
    .action-btn { padding: 10px 20px; border-radius: 14px; font-weight: 800; font-size: 0.75rem; cursor: pointer; transition: 0.3s; border: 1px solid transparent; }
    .action-btn.edit { background: #1a1a1a; color: #666; }
    .action-btn.edit:hover { background: #fff; color: #000; }
    .action-btn.delete { background: rgba(255, 68, 68, 0.05); color: #ff4444; border: 1px solid rgba(255, 68, 68, 0.1); }
    .action-btn.delete:hover { background: #ff4444; color: #fff; }

    /* Upload Zone */
    .upload-zone { border: 2px dashed #222; border-radius: 20px; min-height: 180px; position: relative; overflow: hidden; transition: 0.3s; }
    .upload-zone:hover { border-color: #ff6600; }
    .upload-zone.has-preview { border-style: solid; }
    .upload-trigger { display: flex; align-items: center; justify-content: center; width: 100%; height: 180px; cursor: pointer; }
    .upload-placeholder { text-align: center; color: #555; }
    .up-icon { font-size: 2.5rem; display: block; margin-bottom: 10px; opacity: 0.5; }
    .upload-preview { width: 100%; height: 100%; object-fit: cover; }
    .change-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); color: white; display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; font-weight: 800; }
    .upload-zone:hover .change-overlay { opacity: 1; }

    /* Modal Repair */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.95); backdrop-filter: blur(25px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { position: relative; width: 100%; max-width: 680px; max-height: 90vh; background: #0d0d0d; border: 1px solid #1a1a1a; border-radius: 40px; display: flex; flex-direction: column; box-shadow: 0 50px 150px rgba(0, 0, 0, 0.9); overflow: hidden; }
    .modal-header { padding: 35px 45px 20px; border-bottom: 1px solid #141414; display: flex; justify-content: space-between; align-items: flex-start; flex-shrink: 0; }
    .modal-badge { font-size: 0.6rem; color: #ff6600; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; display: block; }
    .modal-header h2 { font-size: 1.8rem; font-weight: 900; margin: 0; color: #fff; letter-spacing: -1px; }
    .close-modal { background: #1a1a1a; border: none; color: #444; width: 40px; height: 40px; border-radius: 50%; font-size: 1.5rem; cursor: pointer; }
    
    .scroll-body { padding: 30px 45px; overflow-y: auto; flex-grow: 1; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
    .field { display: flex; flex-direction: column; gap: 8px; }
    .field.full-width { grid-column: 1 / span 2; }
    .field label { font-size: 0.7rem; font-weight: 800; color: #444; text-transform: uppercase; letter-spacing: 1px; }
    .field input, .field select { background: #000; border: 1px solid #1a1a1a; padding: 16px; border-radius: 16px; color: #fff; font-family: inherit; font-size: 1rem; width: 100%; box-sizing: border-box; }
    .field input:focus { border-color: #ff6600; outline: none; }
    
    .pricing-vault { background: rgba(255, 255, 255, 0.02); border: 1px solid #1a1a1a; border-radius: 28px; padding: 24px; margin: 25px 0; }
    .vault-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #141414; padding-bottom: 15px; }
    .vault-head label { font-size: 0.75rem; font-weight: 900; color: #eee; text-transform: uppercase; }
    .toggle-group { display: flex; background: #000; padding: 4px; border-radius: 12px; }
    .toggle-group button { background: transparent; border: none; color: #444; padding: 8px 18px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.75rem; transition: 0.3s; }
    .toggle-group button.selected { background: #ff6600; color: #fff; }
    
    .config-portions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
    .portion-card { background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 20px; border: 1px solid #1a1a1a; }
    
    .input-with-symbol { position: relative; width: 100%; }
    .input-with-symbol .symbol { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #444; font-weight: 900; pointer-events: none; }
    .input-with-symbol input { padding-left: 40px !important; }

    .switch-container { display: flex; align-items: center; gap: 15px; cursor: pointer; }
    .switch-container input { display: none; }
    .slider { width: 50px; height: 26px; background: #111; border-radius: 50px; position: relative; transition: 0.4s; border: 1px solid #222; }
    .slider::after { content: ''; position: absolute; left: 4px; top: 4px; width: 18px; height: 18px; background: #444; border-radius: 50%; transition: 0.4s; }
    input:checked + .slider { background: #2ecc71; border-color: #2ecc71; }
    input:checked + .slider::after { transform: translateX(24px); background: #fff; }
    .lbl-text { color: #666; font-size: 0.85rem; font-weight: 700; }
    
    .modal-footer { padding: 25px 45px; display: flex; justify-content: flex-end; gap: 15px; background: #080808; border-top: 1px solid #141414; flex-shrink: 0; }
    .btn-cancel { background: #1a1a1a; color: #666; border: none; padding: 14px 30px; border-radius: 16px; font-weight: 800; cursor: pointer; }
    .btn-confirm { background: #ff6600; color: white; border: none; padding: 14px 40px; border-radius: 16px; font-weight: 900; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 10px; }
    .btn-confirm:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    .animate-pop { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
    `
  ],
})
export class MenuManagementComponent implements OnInit {
  menuService = inject(MenuService);
  toast = inject(ToastService);
  cdr = inject(ChangeDetectorRef);

  menuItems = signal<MenuItem[]>([]);
  isModalOpen = false;
  isEditing = false;
  loading = false;
  
  currentItem: Partial<MenuItem> = this.getEmptyItem();
  selectedFile: File | null = null;
  imagePreview: string | null = null;

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
      if (!this.foodSubCats.includes(this.currentItem.subCategory!)) {
        this.currentItem.subCategory = 'INDIAN';
      }
    }
  }

  setPricingType(type: 'SINGLE' | 'HALF_FULL') {
    if (this.currentItem.pricing) {
      this.currentItem.pricing.type = type;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toast.error('File is too large. Max 5MB allowed.');
        return;
      }
      this.selectedFile = file;
      
      // Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  openModal() {
    this.isEditing = false;
    this.currentItem = this.getEmptyItem();
    this.imagePreview = null;
    this.selectedFile = null;
    this.onCategoryChange();
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  editItem(item: MenuItem) {
    this.isEditing = true;
    this.currentItem = JSON.parse(JSON.stringify(item));
    this.imagePreview = null; // Use currentItem.imageUrl for preview initially
    this.selectedFile = null;
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

  saveItem() {
    this.loading = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', this.currentItem.name!);
    formData.append('category', this.currentItem.category!);
    formData.append('subCategory', this.currentItem.subCategory!);
    formData.append('isAvailable', String(this.currentItem.isAvailable));
    
    // Important: Pricing must be stringified for Multer to handle as a text field
    formData.append('pricing', JSON.stringify(this.currentItem.pricing));

    // Append file if selected
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (!this.isEditing) {
      this.toast.error('Image is required for new dishes.');
      this.loading = false;
      return;
    }

    const request = this.isEditing 
      ? this.menuService.updateMenuItem(this.currentItem._id!, formData)
      : this.menuService.addMenuItem(formData);

    request.subscribe({
      next: () => {
        this.toast.success(`Dish ${this.isEditing ? 'updated' : 'published'} successfully.`);
        this.loadMenu();
        this.closeModal();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.toast.error(e.error?.msg || 'Failed to sync dish.');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteItem(id: string) {
    if (!confirm('This action will permanently erase the dish from the database. Proceed?')) return;
    this.menuService.deleteMenuItem(id).subscribe({
      next: () => {
        this.toast.success('Dish removed from menu.');
        this.loadMenu();
      },
      error: (e) => this.toast.error(e.error?.msg || 'Failed to delete dish.')
    });
  }

  handleImageError(event: any) {
    event.target.src = 'https://placehold.co/600x400/1a1a1a/ffffff?text=Killa+Kitchen';
  }
}